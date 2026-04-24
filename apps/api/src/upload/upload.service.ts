import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface PresignResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

@Injectable()
export class UploadService {
  // Stub — replace body with real AWS S3 presigned URL logic when credentials are ready.
  // Stub — replace body with real AWS S3 presigned URL logic when credentials are ready.
  presign(filename: string, _contentType: string): PresignResult {
    const key = `${randomUUID()}/${filename}`;
    const label = encodeURIComponent(filename.replace(/\.[^.]+$/, ''));
    return {
      uploadUrl: `https://stub-s3.local/upload/${key}`,
      publicUrl: `https://placehold.co/600x400/111827/f97316?text=${label}`,
      key,
    };
  }
}
