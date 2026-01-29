import type { Project, Document, ChatMessage, User } from '@/types';

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
