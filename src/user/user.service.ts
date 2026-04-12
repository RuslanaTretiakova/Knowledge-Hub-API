import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map(this.stripPassword);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.stripPassword(user);
  }

  async create(dto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: dto.password,
        role: (dto.role as any) ?? 'VIEWER',
      },
    });
    return this.stripPassword(user);
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    if (user.password !== dto.oldPassword) {
      throw new ForbiddenException('Old password is incorrect');
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: dto.newPassword },
    });
    return this.stripPassword(updated);
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    await this.prisma.$transaction([
      this.prisma.comment.deleteMany({ where: { authorId: id } }),
      this.prisma.article.updateMany({
        where: { authorId: id },
        data: { authorId: null },
      }),
      this.prisma.user.delete({ where: { id } }),
    ]);
  }

  private stripPassword(user: any) {
    const result = { ...user };
    delete result.password;
    result.role = result.role?.toLowerCase();
    result.createdAt = new Date(result.createdAt).getTime();
    result.updatedAt = new Date(result.updatedAt).getTime();
    return result;
  }
}
