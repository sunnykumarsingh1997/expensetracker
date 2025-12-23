import { PaperlessDocument } from './types';

const PAPERLESS_URL = process.env.PAPERLESS_URL || 'http://localhost:8000';
const PAPERLESS_TOKEN = process.env.PAPERLESS_TOKEN || '';

// Common headers for Paperless API
function getHeaders() {
  return {
    Authorization: `Token ${PAPERLESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

// Get or create tag by name
async function getOrCreateTag(tagName: string): Promise<number | null> {
  try {
    // First, try to find existing tag
    const searchResponse = await fetch(
      `${PAPERLESS_URL}/api/tags/?name__iexact=${encodeURIComponent(tagName)}`,
      { headers: getHeaders() }
    );

    if (searchResponse.ok) {
      const data = await searchResponse.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].id;
      }
    }

    // Tag doesn't exist, create it
    const createResponse = await fetch(`${PAPERLESS_URL}/api/tags/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: tagName,
        color: '#C41E3A', // Hitman red
        is_inbox_tag: false,
      }),
    });

    if (createResponse.ok) {
      const newTag = await createResponse.json();
      return newTag.id;
    }

    return null;
  } catch (error) {
    console.error('Error getting/creating tag:', error);
    return null;
  }
}

// Upload document to Paperless-ngx
export async function uploadToPaperless(
  file: Buffer,
  filename: string,
  username: string,
  category?: string,
  description?: string
): Promise<{ success: boolean; documentId?: number; documentUrl?: string; error?: string }> {
  try {
    // Get or create tags
    const tags: number[] = [];

    // Username tag
    const userTag = await getOrCreateTag(`Agent: ${username}`);
    if (userTag) tags.push(userTag);

    // Category tag
    if (category) {
      const categoryTag = await getOrCreateTag(`Category: ${category}`);
      if (categoryTag) tags.push(categoryTag);
    }

    // Expense tracker tag
    const expenseTag = await getOrCreateTag('Expense Tracker');
    if (expenseTag) tags.push(expenseTag);

    // Create form data for file upload
    const formData = new FormData();
    formData.append('document', new Blob([new Uint8Array(file)]), filename);
    formData.append('title', description || filename);

    // Upload document
    const uploadResponse = await fetch(`${PAPERLESS_URL}/api/documents/post_document/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${PAPERLESS_TOKEN}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    // Get the task ID from response
    const taskResult = await uploadResponse.json();
    const taskId = taskResult.task_id || taskResult;

    // Wait a moment for processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Try to get the document ID from recent documents
    const docsResponse = await fetch(
      `${PAPERLESS_URL}/api/documents/?ordering=-added&page_size=1`,
      { headers: getHeaders() }
    );

    if (docsResponse.ok) {
      const docsData = await docsResponse.json();
      if (docsData.results && docsData.results.length > 0) {
        const doc = docsData.results[0];
        const documentId = doc.id;

        // Update document with tags
        if (tags.length > 0) {
          await fetch(`${PAPERLESS_URL}/api/documents/${documentId}/`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ tags }),
          });
        }

        return {
          success: true,
          documentId,
          documentUrl: `${PAPERLESS_URL}/documents/${documentId}/details`,
        };
      }
    }

    return {
      success: true,
      documentUrl: PAPERLESS_URL,
    };
  } catch (error) {
    console.error('Error uploading to Paperless:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get document by ID
export async function getDocument(documentId: number): Promise<PaperlessDocument | null> {
  try {
    const response = await fetch(`${PAPERLESS_URL}/api/documents/${documentId}/`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching document:', error);
    return null;
  }
}

// Get documents by tag
export async function getDocumentsByTag(tagName: string): Promise<PaperlessDocument[]> {
  try {
    const tag = await getOrCreateTag(tagName);
    if (!tag) return [];

    const response = await fetch(`${PAPERLESS_URL}/api/documents/?tags__id=${tag}`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching documents by tag:', error);
    return [];
  }
}

// Get documents for a specific user
export async function getUserDocuments(username: string): Promise<PaperlessDocument[]> {
  return getDocumentsByTag(`Agent: ${username}`);
}

// Get document download URL
export function getDocumentDownloadUrl(documentId: number): string {
  return `${PAPERLESS_URL}/api/documents/${documentId}/download/`;
}

// Get document preview URL
export function getDocumentPreviewUrl(documentId: number): string {
  return `${PAPERLESS_URL}/api/documents/${documentId}/preview/`;
}

// Get document thumbnail URL
export function getDocumentThumbnailUrl(documentId: number): string {
  return `${PAPERLESS_URL}/api/documents/${documentId}/thumb/`;
}
