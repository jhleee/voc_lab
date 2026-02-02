// =============================================================================
// File Storage Utility
// =============================================================================
// Local file storage for uploaded documents
// =============================================================================

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// -----------------------------------------------------------------------------
// Storage Functions
// -----------------------------------------------------------------------------

/**
 * Ensures the upload directory exists for a project.
 */
export async function ensureUploadDir(projectId: string): Promise<string> {
  const projectDir = path.join(UPLOAD_DIR, projectId);
  await fs.mkdir(projectDir, { recursive: true });
  return projectDir;
}

/**
 * Generates a unique filename for an uploaded file.
 */
export function generateFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
}

/**
 * Saves an uploaded file to the project's upload directory.
 */
export async function saveUploadedFile(
  projectId: string,
  originalName: string,
  buffer: Buffer
): Promise<{ filePath: string; fileName: string }> {
  const projectDir = await ensureUploadDir(projectId);
  const fileName = generateFileName(originalName);
  const filePath = path.join(projectDir, fileName);

  await fs.writeFile(filePath, buffer);

  return { filePath, fileName };
}

/**
 * Reads a file from storage.
 */
export async function readFile(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}

/**
 * Deletes a file from storage.
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Gets the file extension from a filename.
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().slice(1);
}

/**
 * Validates that a file type is supported.
 */
export function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  const supportedTypes = ['pdf', 'txt', 'md', 'doc', 'docx'];
  return supportedTypes.includes(ext);
}

/**
 * Gets the MIME type for a file extension.
 */
export function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
