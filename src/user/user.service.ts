import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User, UserRole } from './user.entity';

@Injectable()
export class UserService {
  private users: User[] = [];

  findAll(): Omit<User, 'password'>[] {
    return this.users.map(this.stripPassword);
  }

  findOne(id: string): Omit<User, 'password'> {
    const user = this.findRaw(id);
    return this.stripPassword(user);
  }

  create(dto: CreateUserDto): Omit<User, 'password'> {
    const now = Date.now();
    const user: User = {
      id: randomUUID(),
      login: dto.login,
      password: dto.password,
      role: dto.role ?? UserRole.VIEWER,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return this.stripPassword(user);
  }

  updatePassword(id: string, dto: UpdatePasswordDto): Omit<User, 'password'> {
    const user = this.findRaw(id);
    if (user.password !== dto.oldPassword) {
      throw new ForbiddenException('Old password is incorrect');
    }
    user.password = dto.newPassword;
    user.updatedAt = Date.now();
    return this.stripPassword(user);
  }

  remove(id: string): void {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new NotFoundException(`User ${id} not found`);
    this.users.splice(index, 1);
  }

  findRaw(id: string): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  private stripPassword(user: User): Omit<User, 'password'> {
    const { password, ...rest } = user;
    return rest;
  }
}
