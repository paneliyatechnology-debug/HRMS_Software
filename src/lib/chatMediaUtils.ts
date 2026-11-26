import { ChatAttachment } from '../types/hrms';
import { getApiBaseUrl } from './config';

export const MAX_CHAT_FILE_BYTES = 8 * 1024 * 1024; // 8 MB safe limit for JSON/Socket transfer
export const MAX_CHAT_IMAGE_INPUT_BYTES = 15 * 1024 * 1024; // 15 MB before compression

export type ChatAttachmentKind = 'image' | 'pdf' | 'audio' | 'document';

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatAudioDuration(seconds?: number): string {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getFileExtension(name?: string): string {
  if (!name) return '';
  const clean = name.split('?')[0].split('#')[0];
  const idx = clean.lastIndexOf('.');
  if (idx === -1 || idx === clean.length - 1) return '';
  return clean.slice(idx + 1).toLowerCase();
}

export function detectAttachmentKind(att: Pick<ChatAttachment, 'type' | 'name' | 'mimeType' | 'url'>): ChatAttachmentKind {
  const mime = (att.mimeType || '').toLowerCase();
  const url = (att.url || '').toLowerCase();
  const ext = getFileExtension(att.name);

  if (
    att.type === 'image' ||
    mime.startsWith('image/') ||
    url.startsWith('data:image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext)
  ) {
    return 'image';
  }

  if (
    att.type === 'audio' ||
    mime.startsWith('audio/') ||
    url.startsWith('data:audio/') ||
    ['mp3', 'wav', 'ogg', 'webm', 'm4a', 'aac', 'flac', 'opus'].includes(ext)
  ) {
    return 'audio';
  }

  if (
    mime === 'application/pdf' ||
    url.startsWith('data:application/pdf') ||
    ext === 'pdf'
  ) {
    return 'pdf';
  }

  if (att.type === 'pdf' && !ext) {
    return 'pdf';
  }

  return 'document';
}

export function isTextPreviewableDocument(att: Pick<ChatAttachment, 'name' | 'mimeType' | 'url'>): boolean {
  const mime = (att.mimeType || '').toLowerCase();
  const ext = getFileExtension(att.name);
  if (mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml') {
    return true;
  }
  return ['txt', 'csv', 'json', 'md', 'log', 'xml', 'yaml', 'yml'].includes(ext);
}

export function getAttachmentFormatLabel(att: Pick<ChatAttachment, 'type' | 'name' | 'mimeType' | 'url'>): string {
  const ext = getFileExtension(att.name);
  if (ext) return ext.toUpperCase();
  const kind = detectAttachmentKind(att);
  if (kind === 'image') return 'IMG';
  if (kind === 'audio') return 'AUDIO';
  if (kind === 'pdf') return 'PDF';
  return 'FILE';
}

export function getAttachmentPreviewText(attachments?: ChatAttachment[]): string {
  if (!attachments || attachments.length === 0) return '';
  const first = attachments[0];
  const kind = detectAttachmentKind(first);
  if (kind === 'image') return first.name ? `Photo: ${first.name}` : 'Photo';
  if (kind === 'audio') return 'Voice note';
  if (kind === 'pdf') return first.name ? `PDF: ${first.name}` : 'PDF document';
  return first.name ? `File: ${first.name}` : 'Sent an attachment';
}

/**
 * Resolves relative backend file paths (e.g. /uploads/...) against the backend server origin.
 * Leaves data:, blob:, http://, and https:// URLs untouched.
 */
export function resolveAttachmentUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }
  const serverOrigin = getApiBaseUrl().replace(/\/api\/?$/, '');
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${serverOrigin}${normalizedPath}`;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) {
    throw new Error('Invalid data URL');
  }
  const header = dataUrl.slice(0, commaIdx);
  const body = dataUrl.slice(commaIdx + 1);
  const mimeMatch = header.match(/data:([^;]+)/i);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const isBase64 = header.includes(';base64');

  if (isBase64) {
    const binary = atob(body);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  return new Blob([decodeURIComponent(body)], { type: mimeType });
}

export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read file contents.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

function compressChatImage(file: File, maxDimension = 1440, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const originalDataUrl = event.target?.result as string;
      if (!originalDataUrl) {
        reject(new Error('Failed to read image.'));
        return;
      }

      // Preserve animated GIFs and vector SVGs directly
      if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
        resolve(originalDataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const needsResize = width > maxDimension || height > maxDimension;

        if (!needsResize && file.size <= 1.2 * 1024 * 1024) {
          resolve(originalDataUrl);
          return;
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(originalDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        try {
          const outMime = file.type === 'image/png' && file.size <= 2 * 1024 * 1024 ? 'image/png' : 'image/jpeg';
          const compressed = canvas.toDataURL(outMime, quality);
          resolve(compressed.length < originalDataUrl.length ? compressed : originalDataUrl);
        } catch {
          resolve(originalDataUrl);
        }
      };
      img.onerror = () => resolve(originalDataUrl);
      img.src = originalDataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

function probeAudioDuration(blob: Blob): Promise<number | undefined> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      resolve(undefined);
      return;
    }
    const objUrl = URL.createObjectURL(blob);
    const audio = new Audio();
    const cleanup = () => {
      URL.revokeObjectURL(objUrl);
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, 2500);

    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      window.clearTimeout(timeout);
      const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? Math.round(audio.duration) : undefined;
      cleanup();
      resolve(dur);
    };
    audio.onerror = () => {
      window.clearTimeout(timeout);
      cleanup();
      resolve(undefined);
    };
    audio.src = objUrl;
  });
}

export async function prepareChatAttachmentFromFile(
  file: File,
  overrideDuration?: number
): Promise<ChatAttachment> {
  const isImage = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(getFileExtension(file.name));
  const isAudio =
    file.type.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'webm', 'm4a', 'aac', 'flac', 'opus'].includes(getFileExtension(file.name));
  const isPdf = file.type === 'application/pdf' || getFileExtension(file.name) === 'pdf';

  if (isImage) {
    if (file.size > MAX_CHAT_IMAGE_INPUT_BYTES) {
      throw new Error('Image is too large. Please select an image under 15 MB.');
    }
    const dataUrl = await compressChatImage(file);
    return {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: 'image',
      url: dataUrl,
      mimeType: file.type || 'image/jpeg',
    };
  }

  if (file.size > MAX_CHAT_FILE_BYTES) {
    throw new Error('File exceeds the 8 MB chat attachment limit.');
  }

  const dataUrl = await readFileAsDataUrl(file);
  const duration = isAudio ? (overrideDuration ?? (await probeAudioDuration(file))) : undefined;

  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: file.name,
    size: formatFileSize(file.size),
    type: isAudio ? 'audio' : isPdf ? 'pdf' : 'document',
    url: dataUrl,
    mimeType: file.type || (isPdf ? 'application/pdf' : isAudio ? 'audio/webm' : 'application/octet-stream'),
    ...(duration !== undefined ? { duration } : {}),
  };
}

/**
 * Triggers a genuine file download for data:, blob:, and http(s): attachment URLs.
 */
export async function downloadChatAttachment(att: ChatAttachment): Promise<void> {
  const resolved = resolveAttachmentUrl(att.url);
  if (!resolved) {
    throw new Error('This attachment does not have a downloadable file.');
  }

  const fileName = att.name || 'attachment';

  if (resolved.startsWith('data:')) {
    const blob = dataUrlToBlob(resolved);
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    return;
  }

  if (resolved.startsWith('blob:')) {
    const anchor = document.createElement('a');
    anchor.href = resolved;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return;
  }

  // Remote HTTP/HTTPS URL: fetch as Blob so cross-origin files actually download with the proper filename
  try {
    const response = await fetch(resolved);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  } catch {
    // Fallback if server blocks CORS fetch
    const anchor = document.createElement('a');
    anchor.href = resolved;
    anchor.download = fileName;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}

/**
 * Opens an attachment in a new browser tab safely (converts data: URLs to Blob URLs so Chrome does not block navigation).
 */
export function openAttachmentInNewTab(att: ChatAttachment): void {
  const resolved = resolveAttachmentUrl(att.url);
  if (!resolved) return;

  if (resolved.startsWith('data:')) {
    const blob = dataUrlToBlob(resolved);
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    return;
  }

  window.open(resolved, '_blank', 'noopener,noreferrer');
}

/**
 * Reads text content from a previewable text/csv/json attachment for in-app viewing.
 */
export async function readTextAttachmentContent(att: ChatAttachment): Promise<string> {
  const resolved = resolveAttachmentUrl(att.url);
  if (!resolved) return '';

  if (resolved.startsWith('data:')) {
    const blob = dataUrlToBlob(resolved);
    return await blob.text();
  }

  const res = await fetch(resolved);
  if (!res.ok) throw new Error(`Failed to load document (${res.status})`);
  return await res.text();
}
