import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    let user = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const adminExists = await this.prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });
      const role = adminExists ? 'VIEWER' : 'ADMIN';
      user = await this.prisma.user.create({
        data: {
          login: dto.login,
          password: hashedPassword,
          role: role as any,
        },
      });
    }

    return {
      id: user.id,
      login: user.login,
      role: user.role.toLowerCase(),
      createdAt: new Date(user.createdAt).getTime(),
      updatedAt: new Date(user.updatedAt).getTime(),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new ForbiddenException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refresh(dto: RefreshDto) {
    if (!dto.refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const revoked = await this.prisma.revokedToken.findUnique({
      where: { token: dto.refreshToken },
    });
    if (revoked) {
      throw new ForbiddenException('Token has been revoked');
    }

    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new ForbiddenException('User not found');
      }

      return this.generateTokens(user);
    } catch {
      throw new ForbiddenException('Invalid or expired refresh token');
    }
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    await this.prisma.revokedToken.create({
      data: { token: refreshToken },
    });

    return { message: 'Logged out successfully' };
  }

  private generateTokens(user: { id: string; login: string; role: string }) {
    const payload = {
      userId: user.id,
      login: user.login,
      role: user.role.toLowerCase(),
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
