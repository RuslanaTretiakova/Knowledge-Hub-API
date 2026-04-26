import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      password: 'admin123',
      role: 'ADMIN',
    },
  });

  const editor = await prisma.user.upsert({
    where: { login: 'editor' },
    update: {},
    create: {
      login: 'editor',
      password: 'editor123',
      role: 'EDITOR',
    },
  });

  const cat1 = await prisma.category.create({
    data: { name: 'Technology', description: 'Tech articles' },
  });
  const cat2 = await prisma.category.create({
    data: { name: 'Science', description: 'Science articles' },
  });
  const cat3 = await prisma.category.create({
    data: { name: 'Programming', description: 'Programming articles' },
  });

  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'nodejs' },
      update: {},
      create: { name: 'nodejs' },
    }),
    prisma.tag.upsert({
      where: { name: 'typescript' },
      update: {},
      create: { name: 'typescript' },
    }),
    prisma.tag.upsert({
      where: { name: 'docker' },
      update: {},
      create: { name: 'docker' },
    }),
    prisma.tag.upsert({
      where: { name: 'prisma' },
      update: {},
      create: { name: 'prisma' },
    }),
    prisma.tag.upsert({
      where: { name: 'nestjs' },
      update: {},
      create: { name: 'nestjs' },
    }),
  ]);

  const article1 = await prisma.article.create({
    data: {
      title: 'Getting Started with NestJS',
      content: 'NestJS is a framework for building server-side applications.',
      status: 'PUBLISHED',
      authorId: admin.id,
      categoryId: cat3.id,
      tags: {
        connect: [{ id: tags[0].id }, { id: tags[1].id }, { id: tags[4].id }],
      },
    },
  });

  const article2 = await prisma.article.create({
    data: {
      title: 'Docker for Beginners',
      content: 'Docker is a platform for containerizing applications.',
      status: 'PUBLISHED',
      authorId: editor.id,
      categoryId: cat1.id,
      tags: { connect: [{ id: tags[2].id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Prisma ORM Guide',
      content: 'Prisma is a next-generation ORM for Node.js.',
      status: 'DRAFT',
      authorId: admin.id,
      categoryId: cat3.id,
      tags: { connect: [{ id: tags[3].id }, { id: tags[1].id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'TypeScript Best Practices',
      content: 'TypeScript adds static typing to JavaScript.',
      status: 'PUBLISHED',
      authorId: editor.id,
      categoryId: cat3.id,
      tags: { connect: [{ id: tags[1].id }] },
    },
  });

  await prisma.article.create({
    data: {
      title: 'Science of Computing',
      content: 'Computing science fundamentals.',
      status: 'ARCHIVED',
      authorId: admin.id,
      categoryId: cat2.id,
      tags: { connect: [{ id: tags[0].id }] },
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Great article!',
      articleId: article1.id,
      authorId: editor.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Very helpful, thanks!',
      articleId: article1.id,
      authorId: admin.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Docker is awesome!',
      articleId: article2.id,
      authorId: admin.id,
    },
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
