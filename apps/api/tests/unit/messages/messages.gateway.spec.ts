import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { MessagesGateway } from '../../../src/messages/messages.gateway';

const mockJwtService = () => ({
  verify: jest.fn(),
});

function makeSocket(overrides: Partial<any> = {}): any {
  return {
    id: 'socket-1',
    handshake: { auth: { token: 'valid-token' } },
    disconnect: jest.fn(),
    _userId: undefined,
    ...overrides,
  };
}

describe('MessagesGateway', () => {
  let gateway: MessagesGateway;
  let jwtService: ReturnType<typeof mockJwtService>;
  let mockServer: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesGateway,
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    gateway = module.get(MessagesGateway);
    jwtService = module.get(JwtService);

    mockServer = { to: jest.fn().mockReturnThis(), emit: jest.fn() };
    gateway['server'] = mockServer;
  });

  afterEach(() => jest.clearAllMocks());

  // ── handleConnection ─────────────────────────────────────────────────────────

  describe('handleConnection', () => {
    it('adds socket to userSockets map on valid token', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      const client = makeSocket();

      gateway.handleConnection(client);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect((client as any)._userId).toBe('user-1');
      expect(gateway['userSockets'].has('user-1')).toBe(true);
      expect(gateway['userSockets'].get('user-1')!.has('socket-1')).toBe(true);
    });

    it('accumulates multiple sockets for the same user', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      const client1 = makeSocket({ id: 'socket-1' });
      const client2 = makeSocket({ id: 'socket-2' });

      gateway.handleConnection(client1);
      gateway.handleConnection(client2);

      expect(gateway['userSockets'].get('user-1')!.size).toBe(2);
    });

    it('disconnects client on invalid/missing token', () => {
      jwtService.verify.mockImplementation(() => { throw new Error('invalid'); });
      const client = makeSocket();

      gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
      expect(gateway['userSockets'].size).toBe(0);
    });
  });

  // ── handleDisconnect ─────────────────────────────────────────────────────────

  describe('handleDisconnect', () => {
    it('removes socket from the map on disconnect', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      const client = makeSocket();
      gateway.handleConnection(client);

      gateway.handleDisconnect(client);

      expect(gateway['userSockets'].has('user-1')).toBe(false);
    });

    it('no-ops when client has no _userId (was never authenticated)', () => {
      const client = makeSocket();
      // No connection call — _userId stays undefined
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });

    it('keeps other sockets for same user after one disconnects', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      const c1 = makeSocket({ id: 'socket-1' });
      const c2 = makeSocket({ id: 'socket-2' });
      gateway.handleConnection(c1);
      gateway.handleConnection(c2);

      gateway.handleDisconnect(c1);

      expect(gateway['userSockets'].get('user-1')!.has('socket-2')).toBe(true);
      expect(gateway['userSockets'].get('user-1')!.has('socket-1')).toBe(false);
    });
  });

  // ── notifyNewMessage ─────────────────────────────────────────────────────────

  describe('notifyNewMessage', () => {
    it('emits new_message to the recipient socket', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-recipient' });
      const recipientSocket = makeSocket({ id: 'socket-r' });
      gateway.handleConnection(recipientSocket);

      const message: any = { id: 'msg-1', senderId: 'user-sender', content: 'Hello' };
      gateway.notifyNewMessage('conv-1', 'user-sender', 'user-recipient', message);

      expect(mockServer.to).toHaveBeenCalledWith('socket-r');
      expect(mockServer.emit).toHaveBeenCalledWith('new_message', {
        conversationId: 'conv-1',
        message,
      });
    });

    it('does not emit when recipient has no connected sockets', () => {
      const message: any = { id: 'msg-1', senderId: 'user-a', content: 'Hi' };
      gateway.notifyNewMessage('conv-1', 'user-a', 'user-b', message);

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  // ── notifyUnreadCount ────────────────────────────────────────────────────────

  describe('notifyUnreadCount', () => {
    it('emits unread_count_changed to the specified user', () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      const client = makeSocket({ id: 'socket-1' });
      gateway.handleConnection(client);

      gateway.notifyUnreadCount('user-1', 5);

      expect(mockServer.to).toHaveBeenCalledWith('socket-1');
      expect(mockServer.emit).toHaveBeenCalledWith('unread_count_changed', { count: 5 });
    });

    it('does not emit when user has no connected sockets', () => {
      gateway.notifyUnreadCount('user-nobody', 3);
      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });
});
