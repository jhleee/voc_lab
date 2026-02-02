// =============================================================================
// Text Chunker
// =============================================================================
// 텍스트를 의미 있는 청크로 분할
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ChunkingOptions {
  /** 청크당 최대 문자 수 (기본: 1000) */
  chunkSize?: number;
  /** 청크 간 중첩 문자 수 (기본: 200) */
  overlap?: number;
  /** 구분자 우선순위 */
  separators?: string[];
}

export interface TextChunk {
  content: string;
  startChar: number;
  endChar: number;
  metadata?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Default Configuration
// -----------------------------------------------------------------------------

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 200;
const DEFAULT_SEPARATORS = [
  '\n\n\n',  // 섹션 구분
  '\n\n',    // 문단 구분
  '\n',      // 줄 바꿈
  '. ',      // 문장 구분
  '! ',
  '? ',
  '; ',
  ', ',
  ' ',       // 단어 구분
];

// -----------------------------------------------------------------------------
// Chunking Functions
// -----------------------------------------------------------------------------

/**
 * 텍스트를 청크로 분할합니다.
 */
export function chunkText(
  text: string,
  options?: ChunkingOptions
): TextChunk[] {
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options?.overlap ?? DEFAULT_OVERLAP;
  const separators = options?.separators ?? DEFAULT_SEPARATORS;

  // 빈 텍스트 처리
  if (!text || text.trim().length === 0) {
    return [];
  }

  // 재귀적 청킹
  const chunks = recursiveChunk(text, chunkSize, overlap, separators, 0);

  return chunks;
}

/**
 * 재귀적으로 텍스트를 분할합니다.
 */
function recursiveChunk(
  text: string,
  chunkSize: number,
  overlap: number,
  separators: string[],
  baseOffset: number
): TextChunk[] {
  // 텍스트가 충분히 작으면 그대로 반환
  if (text.length <= chunkSize) {
    return [
      {
        content: text.trim(),
        startChar: baseOffset,
        endChar: baseOffset + text.length,
      },
    ];
  }

  // 적절한 구분자 찾기
  let bestSeparator = '';
  for (const sep of separators) {
    if (text.includes(sep)) {
      bestSeparator = sep;
      break;
    }
  }

  // 구분자가 없으면 강제로 분할
  if (!bestSeparator) {
    return forceChunk(text, chunkSize, overlap, baseOffset);
  }

  // 구분자로 분할
  const parts = text.split(bestSeparator);
  const chunks: TextChunk[] = [];
  let currentChunk = '';
  let currentOffset = baseOffset;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const separator = i < parts.length - 1 ? bestSeparator : '';
    const combined = currentChunk + (currentChunk ? bestSeparator : '') + part;

    if (combined.length <= chunkSize) {
      currentChunk = combined;
    } else {
      // 현재 청크 저장
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          startChar: currentOffset,
          endChar: currentOffset + currentChunk.length,
        });
        // 다음 청크 시작 위치 (중첩 적용)
        const overlapStart = Math.max(0, currentChunk.length - overlap);
        currentOffset += overlapStart;
        currentChunk = currentChunk.slice(-overlap) + bestSeparator + part;
      } else {
        // 단일 파트가 chunkSize보다 큰 경우 재귀 처리
        const subChunks = recursiveChunk(
          part,
          chunkSize,
          overlap,
          separators.slice(1),
          currentOffset
        );
        chunks.push(...subChunks);
        currentOffset += part.length + separator.length;
        currentChunk = '';
      }
    }
  }

  // 마지막 청크 저장
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      startChar: currentOffset,
      endChar: currentOffset + currentChunk.length,
    });
  }

  return chunks;
}

/**
 * 구분자 없이 강제로 분할합니다.
 */
function forceChunk(
  text: string,
  chunkSize: number,
  overlap: number,
  baseOffset: number
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const content = text.slice(start, end).trim();

    if (content) {
      chunks.push({
        content,
        startChar: baseOffset + start,
        endChar: baseOffset + end,
      });
    }

    // 다음 시작 위치 (중첩 적용)
    start = end - overlap;
    if (start >= text.length - overlap) break;
  }

  return chunks;
}

/**
 * 마크다운 문서를 섹션별로 청킹합니다.
 */
export function chunkMarkdown(
  markdown: string,
  options?: ChunkingOptions
): TextChunk[] {
  const chunks: TextChunk[] = [];
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;

  // 헤딩으로 섹션 분리
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const sections: { heading: string; level: number; content: string; start: number }[] = [];

  let lastEnd = 0;
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    // 이전 섹션 내용 저장
    if (sections.length > 0) {
      sections[sections.length - 1].content = markdown.slice(lastEnd, match.index).trim();
    } else if (match.index > 0) {
      // 첫 헤딩 이전 내용
      const preContent = markdown.slice(0, match.index).trim();
      if (preContent) {
        sections.push({
          heading: '',
          level: 0,
          content: preContent,
          start: 0,
        });
      }
    }

    sections.push({
      heading: match[2],
      level: match[1].length,
      content: '',
      start: match.index,
    });

    lastEnd = match.index + match[0].length;
  }

  // 마지막 섹션 내용
  if (sections.length > 0) {
    sections[sections.length - 1].content = markdown.slice(lastEnd).trim();
  } else {
    // 헤딩 없는 문서
    return chunkText(markdown, options);
  }

  // 섹션별로 청킹
  for (const section of sections) {
    const fullContent = section.heading
      ? `# ${section.heading}\n\n${section.content}`
      : section.content;

    if (fullContent.length <= chunkSize) {
      chunks.push({
        content: fullContent,
        startChar: section.start,
        endChar: section.start + fullContent.length,
        metadata: {
          heading: section.heading || null,
          level: section.level,
        },
      });
    } else {
      // 큰 섹션은 추가 분할
      const subChunks = chunkText(fullContent, options);
      for (const subChunk of subChunks) {
        chunks.push({
          ...subChunk,
          startChar: section.start + subChunk.startChar,
          endChar: section.start + subChunk.endChar,
          metadata: {
            heading: section.heading || null,
            level: section.level,
          },
        });
      }
    }
  }

  return chunks;
}
