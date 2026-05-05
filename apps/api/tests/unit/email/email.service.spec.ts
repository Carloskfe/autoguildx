import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../../src/email/email.service';

const mockConfigService = (values: Record<string, string | undefined> = {}) => ({
  get: jest.fn((key: string) => values[key]),
});

describe('EmailService', () => {
  let service: EmailService;
  let fetchSpy: jest.SpyInstance;

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  function buildService(envValues: Record<string, string | undefined> = {}) {
    return Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService(envValues) },
      ],
    })
      .compile()
      .then((m: TestingModule) => m.get(EmailService));
  }

  describe('when EMAIL_API_KEY is not set', () => {
    it('skips sending and logs a warning instead', async () => {
      service = await buildService({});
      const warnSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation(() => {});
      fetchSpy = jest.spyOn(global, 'fetch' as any);

      await service.send({ to: 'user@test.com', subject: 'Test', html: '<p>Hi</p>' });

      expect(warnSpy).toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('when EMAIL_API_KEY is set', () => {
    beforeEach(async () => {
      service = await buildService({
        EMAIL_API_KEY: 'test-key',
        EMAIL_FROM: 'noreply@autoguildx.com',
      });
    });

    it('POSTs to the Resend API with correct headers and body', async () => {
      fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      await service.send({ to: 'user@test.com', subject: 'Hello', html: '<p>Hi</p>' });

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
          body: expect.stringContaining('"to":["user@test.com"]'),
        }),
      );
    });

    it('logs an error when Resend returns a non-OK response', async () => {
      fetchSpy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
        ok: false,
        status: 422,
        text: async () => 'Invalid email',
      } as Response);
      const errorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {});

      await service.send({ to: 'bad', subject: 'Test', html: '<p>Hi</p>' });

      expect(errorSpy).toHaveBeenCalled();
    });

    it('logs an error and does not throw when fetch rejects', async () => {
      fetchSpy = jest.spyOn(global, 'fetch' as any).mockRejectedValue(new Error('network'));
      const errorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {});

      await expect(service.send({ to: 'user@test.com', subject: 'X', html: '' })).resolves.not.toThrow();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
