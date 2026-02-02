// =============================================================================
// Document Parsers
// =============================================================================
// 다양한 파일 형식에서 텍스트 추출
// =============================================================================

import fs from 'fs/promises';

// -----------------------------------------------------------------------------
// Parser Functions
// -----------------------------------------------------------------------------

/**
 * 파일에서 텍스트를 추출합니다.
 */
export async function parseDocument(
  filePath: string,
  fileType: string
): Promise<string> {
  switch (fileType.toLowerCase()) {
    case 'txt':
      return parseTxt(filePath);
    case 'md':
      return parseMarkdown(filePath);
    case 'pdf':
      return parsePdf(filePath);
    case 'doc':
    case 'docx':
      return parseDocx(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * 일반 텍스트 파일 파싱
 */
async function parseTxt(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
}

/**
 * 마크다운 파일 파싱
 * (마크다운 문법은 그대로 유지 - 청킹 시 활용)
 */
async function parseMarkdown(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
}

/**
 * PDF 파일 파싱
 * MVP: pdf-parse 라이브러리 사용 (설치 필요)
 */
async function parsePdf(filePath: string): Promise<string> {
  try {
    // 동적 import (설치되지 않았을 경우 대비)
    const pdfParse = await import('pdf-parse').then(m => m.default);
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      throw new Error('PDF parsing requires pdf-parse package. Run: npm install pdf-parse');
    }
    throw error;
  }
}

/**
 * DOC/DOCX 파일 파싱
 * MVP: mammoth 라이브러리 사용 (설치 필요)
 */
async function parseDocx(filePath: string): Promise<string> {
  try {
    // 동적 import (설치되지 않았을 경우 대비)
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      throw new Error('DOCX parsing requires mammoth package. Run: npm install mammoth');
    }
    throw error;
  }
}
