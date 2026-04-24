import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from '../../../src/upload/upload.service';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();
    service = module.get(UploadService);
  });

  describe('presign', () => {
    it('returns uploadUrl, publicUrl, and key', () => {
      const result = service.presign('avatar.jpg', 'image/jpeg');
      expect(result.uploadUrl).toBeTruthy();
      expect(result.publicUrl).toBeTruthy();
      expect(result.key).toBeTruthy();
    });

    it('generates a unique key per call', () => {
      const a = service.presign('photo.png', 'image/png');
      const b = service.presign('photo.png', 'image/png');
      expect(a.key).not.toBe(b.key);
    });

    it('includes the filename in uploadUrl and key', () => {
      const { uploadUrl, key } = service.presign('listing.jpg', 'image/jpeg');
      expect(uploadUrl).toContain('listing.jpg');
      expect(key).toContain('listing.jpg');
    });

    it('strips file extension from publicUrl label', () => {
      const { publicUrl } = service.presign('avatar.jpg', 'image/jpeg');
      expect(publicUrl).toContain('avatar');
      expect(publicUrl).not.toContain('.jpg');
    });
  });
});
