import type { Project, Document, ChatMessage, User, PromptCategory, Prompt, PromptVersion } from '@/types';

export const mockUser: User = {
  id: 'user-1',
  name: '홍길동',
  email: 'hong@example.com',
  avatar: undefined,
};

export const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: '고객 상담 챗봇',
    description: '고객 문의 응대를 위한 AI 챗봇',
    userId: 'user-1',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-28'),
  },
  {
    id: 'project-2',
    name: 'FAQ 봇',
    description: '자주 묻는 질문 자동 응답 봇',
    userId: 'user-1',
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-01-27'),
  },
  {
    id: 'project-3',
    name: '주문 안내 봇',
    description: '주문 및 배송 안내 챗봇',
    userId: 'user-1',
    createdAt: new Date('2025-01-25'),
    updatedAt: new Date('2025-01-29'),
  },
];

export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    title: '고객 응대 가이드',
    content: '고객 응대 시 기본 원칙과 주의사항...',
    fileType: 'pdf',
    fileSize: 1024 * 512, // 512KB
    projectId: 'project-1',
    createdAt: new Date('2025-01-16'),
    updatedAt: new Date('2025-01-16'),
  },
  {
    id: 'doc-2',
    title: '제품 카탈로그',
    content: '2025년 신제품 카탈로그...',
    fileType: 'pdf',
    fileSize: 1024 * 1024 * 2, // 2MB
    projectId: 'project-1',
    createdAt: new Date('2025-01-17'),
    updatedAt: new Date('2025-01-20'),
  },
  {
    id: 'doc-3',
    title: '환불 정책',
    content: '환불 및 교환 정책에 대한 상세 안내...',
    fileType: 'doc',
    fileSize: 1024 * 256, // 256KB
    projectId: 'project-1',
    createdAt: new Date('2025-01-18'),
    updatedAt: new Date('2025-01-18'),
  },
  {
    id: 'doc-4',
    title: '자주 묻는 질문',
    content: 'Q1. 배송은 얼마나 걸리나요?\nA1. 일반적으로 2-3일...',
    fileType: 'md',
    fileSize: 1024 * 64, // 64KB
    projectId: 'project-1',
    createdAt: new Date('2025-01-19'),
    updatedAt: new Date('2025-01-25'),
  },
  {
    id: 'doc-5',
    title: '회원 등급 안내',
    content: 'VIP, Gold, Silver 등급별 혜택 안내...',
    fileType: 'txt',
    fileSize: 1024 * 32, // 32KB
    projectId: 'project-1',
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-01-20'),
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: '안녕하세요, 챗봇 테스트입니다.',
    timestamp: new Date('2025-01-29T10:00:00'),
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: '안녕하세요! 무엇을 도와드릴까요?',
    timestamp: new Date('2025-01-29T10:00:05'),
  },
  {
    id: 'msg-3',
    role: 'user',
    content: '배송 조회를 하고 싶어요.',
    timestamp: new Date('2025-01-29T10:01:00'),
  },
  {
    id: 'msg-4',
    role: 'assistant',
    content: '배송 조회를 도와드리겠습니다. 주문번호를 알려주시겠어요?',
    timestamp: new Date('2025-01-29T10:01:03'),
  },
];

export const defaultPrompt = `당신은 친절한 고객 상담 AI 어시스턴트입니다.

## 역할
- 고객의 문의에 정확하고 친절하게 응답합니다.
- 제공된 문서를 기반으로 답변합니다.
- 모르는 내용은 솔직하게 모른다고 말합니다.

## 응답 스타일
- 존댓말을 사용합니다.
- 간결하고 명확하게 답변합니다.
- 필요시 단계별로 안내합니다.

## 주의사항
- 개인정보를 요청하지 않습니다.
- 확실하지 않은 정보는 제공하지 않습니다.
`;

// 기본 프리셋 카테고리 정의
export const DEFAULT_PROMPT_CATEGORIES = [
  { name: '시스템 프롬프트', description: 'AI 어시스턴트의 기본 성격과 역할 정의' },
  { name: '인사말', description: '대화 시작 시 사용되는 인사 메시지' },
  { name: '에러 응답', description: '오류 발생 시 사용되는 응답 메시지' },
  { name: '폴백 응답', description: '답변을 찾지 못했을 때 사용되는 메시지' },
];

export const mockPromptCategories: PromptCategory[] = [
  {
    id: 'cat-1',
    name: '시스템 프롬프트',
    description: 'AI 어시스턴트의 기본 성격과 역할 정의',
    isDefault: true,
    projectId: 'project-1',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'cat-2',
    name: '인사말',
    description: '대화 시작 시 사용되는 인사 메시지',
    isDefault: true,
    projectId: 'project-1',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'cat-3',
    name: '에러 응답',
    description: '오류 발생 시 사용되는 응답 메시지',
    isDefault: true,
    projectId: 'project-1',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'cat-4',
    name: '폴백 응답',
    description: '답변을 찾지 못했을 때 사용되는 메시지',
    isDefault: true,
    projectId: 'project-1',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
];

export const mockPromptVersions: PromptVersion[] = [
  {
    id: 'ver-1-1',
    version: 1,
    content: defaultPrompt,
    promptId: 'prompt-1',
    createdAt: new Date('2025-01-15'),
  },
  {
    id: 'ver-1-2',
    version: 2,
    content: defaultPrompt + '\n- 이모지는 사용하지 않습니다.',
    promptId: 'prompt-1',
    createdAt: new Date('2025-01-20'),
  },
  {
    id: 'ver-1-3',
    version: 3,
    content: defaultPrompt + '\n- 이모지는 사용하지 않습니다.\n- 응답은 300자 이내로 유지합니다.',
    promptId: 'prompt-1',
    createdAt: new Date('2025-01-28'),
  },
  {
    id: 'ver-2-1',
    version: 1,
    content: '안녕하세요! 무엇을 도와드릴까요?',
    promptId: 'prompt-2',
    createdAt: new Date('2025-01-15'),
  },
  {
    id: 'ver-3-1',
    version: 1,
    content: '안녕하세요! 고객 상담 챗봇입니다. 궁금한 점이 있으시면 편하게 물어보세요.',
    promptId: 'prompt-3',
    createdAt: new Date('2025-01-16'),
  },
  {
    id: 'ver-4-1',
    version: 1,
    content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    promptId: 'prompt-4',
    createdAt: new Date('2025-01-15'),
  },
  {
    id: 'ver-5-1',
    version: 1,
    content: '죄송합니다. 해당 질문에 대한 답변을 찾지 못했습니다. 다른 방식으로 질문해 주시거나, 상담원 연결을 원하시면 말씀해 주세요.',
    promptId: 'prompt-5',
    createdAt: new Date('2025-01-15'),
  },
];

// 기본 프롬프트 데이터 (versions는 동적으로 조인)
const basePrompts: Omit<Prompt, 'versions'>[] = [
  {
    id: 'prompt-1',
    name: '기본 시스템 프롬프트',
    isActive: true,
    categoryId: 'cat-1',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-28'),
  },
  {
    id: 'prompt-2',
    name: '기본 인사말',
    isActive: true,
    categoryId: 'cat-2',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'prompt-3',
    name: '친근한 인사말',
    isActive: false,
    categoryId: 'cat-2',
    createdAt: new Date('2025-01-16'),
    updatedAt: new Date('2025-01-16'),
  },
  {
    id: 'prompt-4',
    name: '기본 에러 응답',
    isActive: true,
    categoryId: 'cat-3',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'prompt-5',
    name: '기본 폴백 응답',
    isActive: true,
    categoryId: 'cat-4',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
];

// 프롬프트와 버전을 동적으로 조인하는 헬퍼 함수
export function getPromptsWithVersions(): Prompt[] {
  return basePrompts.map(prompt => ({
    ...prompt,
    versions: mockPromptVersions
      .filter(v => v.promptId === prompt.id)
      .sort((a, b) => b.version - a.version),
  }));
}

// 호환성을 위한 export (초기 로드 시점의 스냅샷)
export const mockPrompts: Prompt[] = getPromptsWithVersions();
