import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SignupDto } from '../../auth/dto/signup.dto';
import { LoginDto } from '../../auth/dto/login.dto';
import { RefreshDto } from '../../auth/dto/refresh.dto';
import { CreateArticleDto } from '../../article/dto/create-article.dto';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { UpdatePasswordDto } from '../../user/dto/update-password.dto';
import { CreateCategoryDto } from '../../category/dto/create-category.dto';
import { CreateCommentDto } from '../../comment/dto/create-comment.dto';

describe('DTO Validation', () => {
  describe('SignupDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(SignupDto, {
        login: 'user',
        password: 'pass',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail without login', async () => {
      const dto = plainToInstance(SignupDto, { password: 'pass' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without password', async () => {
      const dto = plainToInstance(SignupDto, { login: 'user' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with non-string login', async () => {
      const dto = plainToInstance(SignupDto, { login: 123, password: 'pass' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('LoginDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(LoginDto, {
        login: 'user',
        password: 'pass',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail without login', async () => {
      const dto = plainToInstance(LoginDto, { password: 'pass' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without password', async () => {
      const dto = plainToInstance(LoginDto, { login: 'user' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('RefreshDto', () => {
    it('should pass with valid refreshToken', async () => {
      const dto = plainToInstance(RefreshDto, { refreshToken: 'token' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail without refreshToken', async () => {
      const dto = plainToInstance(RefreshDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateArticleDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateArticleDto, {
        title: 'Test',
        content: 'Content',
        status: 'draft',
        tags: [],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail without title', async () => {
      const dto = plainToInstance(CreateArticleDto, {
        content: 'Content',
        status: 'draft',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without content', async () => {
      const dto = plainToInstance(CreateArticleDto, {
        title: 'Test',
        status: 'draft',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid status enum', async () => {
      const dto = plainToInstance(CreateArticleDto, {
        title: 'Test',
        content: 'Content',
        status: 'invalid_status',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateUserDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateUserDto, {
        login: 'user',
        password: 'pass',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail without login', async () => {
      const dto = plainToInstance(CreateUserDto, { password: 'pass' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without password', async () => {
      const dto = plainToInstance(CreateUserDto, { login: 'user' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdatePasswordDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(UpdatePasswordDto, {
        oldPassword: 'old',
        newPassword: 'new',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail without oldPassword', async () => {
      const dto = plainToInstance(UpdatePasswordDto, { newPassword: 'new' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without newPassword', async () => {
      const dto = plainToInstance(UpdatePasswordDto, { oldPassword: 'old' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateCategoryDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        name: 'Category',
        description: 'Description',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail without name', async () => {
      const dto = plainToInstance(CreateCategoryDto, {
        description: 'Description',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateCommentDto', () => {
    it('should pass with valid data', async () => {
      const dto = plainToInstance(CreateCommentDto, {
        content: 'Comment',
        articleId: '0a35dd62-e09f-444b-a628-f4e7c6954f57',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail without content', async () => {
      const dto = plainToInstance(CreateCommentDto, {
        articleId: '0a35dd62-e09f-444b-a628-f4e7c6954f57',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail without articleId', async () => {
      const dto = plainToInstance(CreateCommentDto, { content: 'Comment' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail with invalid UUID articleId', async () => {
      const dto = plainToInstance(CreateCommentDto, {
        content: 'Comment',
        articleId: 'invalid-uuid',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
