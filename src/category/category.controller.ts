import {
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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by id' })
  findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.categoryService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create category' })
  create(@Body() dto: CreateCategoryDto, @Request() req: any) {
    const role = req.user?.role?.toUpperCase();
    if (role !== 'ADMIN')
      throw new ForbiddenException('Only admins can create categories');
    return this.categoryService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category' })
  update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @Request() req: any,
  ) {
    const role = req.user?.role?.toUpperCase();
    if (role !== 'ADMIN')
      throw new ForbiddenException('Only admins can update categories');
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete category' })
  remove(@Param('id', ParseUuidPipe) id: string, @Request() req: any) {
    const role = req.user?.role?.toUpperCase();
    if (role !== 'ADMIN')
      throw new ForbiddenException('Only admins can delete categories');
    return this.categoryService.remove(id);
  }
}
