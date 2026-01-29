import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

const DEFAULT_PROMPT_CATEGORIES = [
  { name: '시스템 프롬프트', description: 'AI 어시스턴트의 기본 성격과 역할 정의' },
  { name: '인사말', description: '대화 시작 시 사용되는 인사 메시지' },
  { name: '에러 응답', description: '오류 발생 시 사용되는 응답 메시지' },
  { name: '폴백 응답', description: '답변을 찾지 못했을 때 사용되는 메시지' },
];

async function main() {
  console.log('Seeding database...');

  // 기본 사용자 생성
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      id: 'user-1',
      name: '데모 사용자',
      email: 'demo@example.com',
    },
  });
  console.log('Created user:', user.id);

  // 기본 프로젝트 생성
  const project = await prisma.project.upsert({
    where: { id: 'project-1' },
    update: {},
    create: {
      id: 'project-1',
      name: '고객 상담 챗봇',
      description: '고객 문의를 처리하는 AI 챗봇',
      userId: user.id,
    },
  });
  console.log('Created project:', project.id);

  // 기본 프롬프트 카테고리 생성
  for (const cat of DEFAULT_PROMPT_CATEGORIES) {
    const categoryId = `cat-${cat.name.replace(/\s/g, '-')}`;

    // 먼저 존재 여부 확인
    const existing = await prisma.promptCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      const category = await prisma.promptCategory.create({
        data: {
          id: categoryId,
          name: cat.name,
          description: cat.description,
          isDefault: true,
          projectId: project.id,
        },
      });
      console.log('Created category:', category.name);
    } else {
      console.log('Category already exists:', cat.name);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
