import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as AWS from 'aws-sdk';

export interface PresignResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
]);

@Injectable()
export class UploadService {
  private readonly s3: AWS.S3 | null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly logger = new Logger(UploadService.name);

  constructor() {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_REGION } = process.env;

    if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_S3_BUCKET) {
      const region = AWS_REGION || 'us-east-1';
      this.bucket = AWS_S3_BUCKET;
      this.s3 = new AWS.S3({
        region,
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      });
      this.publicBaseUrl =
        process.env.AWS_S3_PUBLIC_URL || `https://${AWS_S3_BUCKET}.s3.${region}.amazonaws.com`;
      this.logger.log(`S3 uploads active — bucket: ${AWS_S3_BUCKET} (${region})`);
    } else {
      this.s3 = null;
      this.logger.warn('AWS credentials not set — using stub uploads (placehold.co placeholders)');
    }
  }

  async presign(filename: string, contentType: string): Promise<PresignResult> {
    if (!ALLOWED_TYPES.has(contentType)) {
      throw new BadRequestException(`Unsupported file type: ${contentType}`);
    }

    const safeFilename = filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '_')
      .slice(0, 200);
    const key = `uploads/${randomUUID()}/${safeFilename}`;

    if (!this.s3) return this.stubResult(key, safeFilename);

    const uploadUrl = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: 300, // 5-minute window
      ContentType: contentType,
    });

    return { uploadUrl, publicUrl: `${this.publicBaseUrl}/${key}`, key };
  }

  private stubResult(key: string, filename: string): PresignResult {
    const label = encodeURIComponent(filename.replace(/\.[^.]+$/, ''));
    return {
      uploadUrl: `https://stub-s3.local/upload/${key}`,
      publicUrl: `https://placehold.co/600x400/111827/f97316?text=${label}`,
      key,
    };
  }
}
