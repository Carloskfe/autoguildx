import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from '../../../src/upload/upload.service';

describe('UploadService (stub mode — no AWS credentials)', () => {
  let service: UploadService;

  beforeEach(async () => {
    // Ensure no real credentials leak into tests
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_S3_BUCKET;

    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();
    service = module.get(UploadService);
  });

  describe('presign', () => {
    it('returns uploadUrl, publicUrl, and key', async () => {
      const result = await service.presign('avatar.jpg', 'image/jpeg');
      expect(result.uploadUrl).toBeTruthy();
      expect(result.publicUrl).toBeTruthy();
      expect(result.key).toBeTruthy();
    });

    it('generates a unique key per call', async () => {
      const a = await service.presign('photo.png', 'image/png');
      const b = await service.presign('photo.png', 'image/png');
      expect(a.key).not.toBe(b.key);
    });

    it('includes the filename in the key', async () => {
      const { key } = await service.presign('listing.jpg', 'image/jpeg');
      expect(key).toContain('listing.jpg');
    });

    it('stub uploadUrl points to stub-s3.local', async () => {
      const { uploadUrl } = await service.presign('avatar.jpg', 'image/jpeg');
      expect(uploadUrl).toContain('stub-s3.local');
    });

    it('stub publicUrl is a placeholder image', async () => {
      const { publicUrl } = await service.presign('avatar.jpg', 'image/jpeg');
      expect(publicUrl).toContain('placehold.co');
    });

    it('sanitises dangerous filename characters', async () => {
      const { key } = await service.presign('../../../etc/passwd', 'image/jpeg');
      expect(key).not.toContain('..');
      expect(key).not.toContain('/etc/passwd');
    });

    it('throws BadRequestException for disallowed content types', async () => {
      await expect(service.presign('script.exe', 'application/octet-stream')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('accepts video/mp4', async () => {
      const result = await service.presign('clip.mp4', 'video/mp4');
      expect(result.key).toContain('clip.mp4');
    });
  });
});
