import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ArticleModule } from './article/article.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { CommentModule } from './comment/comment.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    UserModule,
    CategoryModule,
    ArticleModule,
    CommentModule,
  ],
})
export class AppModule {}
