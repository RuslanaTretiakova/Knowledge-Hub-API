import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create user' })
  create(@Body() dto: CreateUserDto, @Request() req: any) {
    const role = req.user?.role?.toUpperCase();
    if (role !== 'ADMIN')
      throw new ForbiddenException('Only admins can create users');
    return this.userService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const currentUser = req.user;
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

    if (body.role !== undefined) {
      if (!isAdmin) {
        throw new ForbiddenException('Only admin can change roles');
      }
      return this.userService.updateRole(id, body.role);
    }

    if (!body.oldPassword || !body.newPassword) {
      throw new BadRequestException('oldPassword and newPassword are required');
    }

    if (!isAdmin && currentUser?.userId !== id) {
      throw new ForbiddenException('You can only update your own password');
    }

    return this.userService.updatePassword(id, body as UpdatePasswordDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id', ParseUuidPipe) id: string, @Request() req: any) {
    const currentUser = req.user;
    const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
    if (!isAdmin && currentUser?.userId !== id) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return this.userService.remove(id);
  }
}
