import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  private categories: Category[] = [];

  findAll(): Category[] {
    return this.categories;
  }

  findOne(id: string): Category {
    const category = this.categories.find((c) => c.id === id);
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  create(dto: CreateCategoryDto): Category {
    const category: Category = { id: randomUUID(), ...dto };
    this.categories.push(category);
    return category;
  }

  update(id: string, dto: UpdateCategoryDto): Category {
    const category = this.findOne(id);
    Object.assign(category, dto);
    return category;
  }

  remove(id: string): void {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundException(`Category ${id} not found`);
    this.categories.splice(index, 1);
  }

  exists(id: string): boolean {
    return this.categories.some((c) => c.id === id);
  }
}
