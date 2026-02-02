import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  saveUploadedFile,
  getFileExtension,
  isValidFileType,
} from '@/lib/upload';

// GET: 프로젝트의 모든 문서 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const documents = await prisma.document.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            chunks: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST: 새 문서 업로드
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Content-Type 확인
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // 파일 업로드 처리
      return handleFileUpload(request, projectId);
    } else if (contentType.includes('application/json')) {
      // JSON 데이터 처리 (직접 텍스트 입력)
      return handleJsonUpload(request, projectId);
    }

    return NextResponse.json(
      { error: 'Unsupported content type' },
      { status: 415 }
    );
  } catch (error) {
    console.error('Failed to create document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

// 파일 업로드 처리
async function handleFileUpload(
  request: NextRequest,
  projectId: string
): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json(
      { error: 'No file provided' },
      { status: 400 }
    );
  }

  // 파일 타입 검증
  if (!isValidFileType(file.name)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Supported: pdf, txt, md, doc, docx' },
      { status: 400 }
    );
  }

  // 파일 크기 제한 (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'File size exceeds 10MB limit' },
      { status: 400 }
    );
  }

  // 파일 저장
  const buffer = Buffer.from(await file.arrayBuffer());
  const { filePath } = await saveUploadedFile(projectId, file.name, buffer);

  // 제목 추출 (확장자 제거)
  const title = file.name.replace(/\.[^/.]+$/, '');
  const fileType = getFileExtension(file.name);

  // DB에 문서 레코드 생성
  const document = await prisma.document.create({
    data: {
      title,
      content: '', // 파싱 후 채워짐
      fileType,
      fileSize: file.size,
      filePath,
      status: 'PENDING',
      projectId,
    },
  });

  return NextResponse.json(document, { status: 201 });
}

// JSON 데이터 처리 (직접 텍스트 입력)
async function handleJsonUpload(
  request: NextRequest,
  projectId: string
): Promise<NextResponse> {
  const body = await request.json();
  const { title, content, fileType = 'txt' } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: 'Title and content are required' },
      { status: 400 }
    );
  }

  // DB에 문서 레코드 생성
  const document = await prisma.document.create({
    data: {
      title,
      content,
      fileType,
      fileSize: Buffer.byteLength(content, 'utf8'),
      status: 'PENDING',
      projectId,
    },
  });

  return NextResponse.json(document, { status: 201 });
}
