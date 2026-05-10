import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ArticleStatus } from '../../article/article.entity';

export class RagSearchRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query!: string;

  @ApiPropertyOptional({ default: 5, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;

  @ApiPropertyOptional({ enum: ArticleStatus })
  @IsOptional()
  @IsEnum(ArticleStatus)
  articleStatus?: ArticleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
