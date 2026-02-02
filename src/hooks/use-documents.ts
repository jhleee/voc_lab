'use client';

// =============================================================================
// Document Management Hook
// =============================================================================

import { useState, useCallback, useEffect } from 'react';
import type { Document } from '@/types';

interface UseDocumentsOptions {
  projectId: string;
}

interface UseDocumentsReturn {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  uploadDocument: (file: File) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<boolean>;
  processDocument: (id: string) => Promise<boolean>;
  refreshDocuments: () => Promise<void>;
}

export function useDocuments({ projectId }: UseDocumentsOptions): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents
  const refreshDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/documents`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data.map((doc: Document) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  // Upload document
  const uploadDocument = useCallback(async (file: File): Promise<Document | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }

      const newDoc = await response.json();
      const document: Document = {
        ...newDoc,
        createdAt: new Date(newDoc.createdAt),
        updatedAt: new Date(newDoc.updatedAt),
      };

      setDocuments((prev) => [document, ...prev]);

      // Start processing automatically
      processDocument(document.id);

      return document;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    }
  }, [projectId]);

  // Delete document
  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      return false;
    }
  }, [projectId]);

  // Process document (trigger parsing & embedding)
  const processDocument = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents/${id}/process`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start processing');
      }

      // Update local state to show processing
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id ? { ...doc, status: 'PROCESSING' as const } : doc
        )
      );

      // Poll for status updates
      pollDocumentStatus(id);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      return false;
    }
  }, [projectId]);

  // Poll document processing status
  const pollDocumentStatus = useCallback(async (id: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/documents/${id}/process`);
        if (!response.ok) return;

        const data = await response.json();

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === id
              ? {
                  ...doc,
                  status: data.status,
                  _count: { chunks: data.chunkCount },
                }
              : doc
          )
        );

        // Continue polling if still processing
        if (data.status === 'PROCESSING' || data.status === 'EMBEDDING') {
          setTimeout(checkStatus, 2000);
        }
      } catch {
        // Ignore polling errors
      }
    };

    checkStatus();
  }, [projectId]);

  return {
    documents,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    processDocument,
    refreshDocuments,
  };
}
