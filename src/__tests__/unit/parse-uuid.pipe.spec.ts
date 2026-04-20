import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';

describe('ParseUuidPipe', () => {
  const pipe = new ParseUuidPipe();

  it('should pass valid UUID', () => {
    const uuid = '0a35dd62-e09f-444b-a628-f4e7c6954f57';
    expect(pipe.transform(uuid)).toBe(uuid);
  });

  it('should throw BadRequestException for invalid UUID', () => {
    expect(() => pipe.transform('invalid-id')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for empty string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for number string', () => {
    expect(() => pipe.transform('12345')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for null-like string', () => {
    expect(() => pipe.transform('null')).toThrow(BadRequestException);
  });
});