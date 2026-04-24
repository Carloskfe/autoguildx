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
      expect(result.uploadUrl).toContain('avatar.jpg');
      expect(result.publicUrl).toContain('avatar.jpg');
      expect(result.key).toContain('avatar.jpg');
    });

    it('generates a unique key per call', () => {
      const a = service.presign('photo.png', 'image/png');
      const b = service.presign('photo.png', 'image/png');
      expect(a.key).not.toBe(b.key);
    });

    it('includes the filename in all returned URLs', () => {
      const { uploadUrl, publicUrl, key } = service.presign('listing.jpg', 'image/jpeg');
      expect(uploadUrl).toMatch(/listing\.jpg$/);
      expect(publicUrl).toMatch(/listing\.jpg$/);
      expect(key).toMatch(/listing\.jpg$/);
    });
  });
});
