import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty()
  @IsUUID(4)
  @IsNotEmpty()
  articleId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID(4)
  authorId?: string;
}
