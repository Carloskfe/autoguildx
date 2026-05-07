import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserEntity } from './entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';
import { templates } from '../email/email.templates';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      role: dto.role || 'enthusiast',
      emailVerificationToken,
    });
    await this.userRepo.save(user);
    await this.sendVerificationEmail(user.email, emailVerificationToken);

    return { ...this.issueToken(user), emailVerified: false };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'passwordHash', 'role', 'emailVerified'],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return { ...this.issueToken(user), emailVerified: user.emailVerified };
  }

  async loginWithFirebase(firebaseUid: string, email: string, provider: string) {
    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      user = this.userRepo.create({ email, provider, emailVerified: true });
      await this.userRepo.save(user);
    }
    return { ...this.issueToken(user), emailVerified: user.emailVerified };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.emailVerificationToken')
      .where('u.emailVerificationToken = :token', { token })
      .getOne();
    if (!user) throw new BadRequestException('Invalid or expired verification token');

    await this.userRepo.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
    });
    return { verified: true };
  }

  async resendVerification(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('No account found with that email');
    if (user.emailVerified) return { message: 'Email already verified' };

    const token = crypto.randomBytes(32).toString('hex');
    await this.userRepo.update(user.id, { emailVerificationToken: token });
    await this.sendVerificationEmail(email, token);
    return { message: 'Verification email sent' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('No account found with that email');

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userRepo.update(user.id, {
      passwordResetToken: token,
      passwordResetExpiry: expiry,
    });

    const frontend = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontend}/reset-password?token=${token}`;
    await this.emailService.send({ to: email, ...templates.passwordReset(resetUrl) });
    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordResetToken')
      .where('u.passwordResetToken = :token', { token })
      .getOne();

    if (!user) throw new BadRequestException('Invalid or expired reset token');
    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepo.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    });
    return { message: 'Password updated successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'passwordHash', 'provider'],
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.passwordHash) {
      throw new BadRequestException('Social login accounts cannot change password here');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepo.update(userId, { passwordHash });
    return { message: 'Password changed successfully' };
  }

  async deleteAccount(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.delete(userId);
    return { message: 'Account deleted' };
  }

  private async sendVerificationEmail(email: string, token: string) {
    const frontend = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const verifyUrl = `${frontend}/verify-email?token=${token}`;
    await this.emailService.send({ to: email, ...templates.verifyEmail(verifyUrl) });
  }

  private issueToken(user: UserEntity) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { accessToken: this.jwtService.sign(payload), userId: user.id };
  }
}
