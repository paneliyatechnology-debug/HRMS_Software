'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  FileText,
  Image as ImageIcon,
  Mic,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ChatAttachment } from '../../types/hrms';
import {
  detectAttachmentKind,
  resolveAttachmentUrl,
  getAttachmentFormatLabel,
  isTextPreviewableDocument,
  dataUrlToBlob,
  downloadChatAttachment,
  openAttachmentInNewTab,
  readTextAttachmentContent,
} from '../../lib/chatMediaUtils';

interface ChatAttachmentPreviewModalProps {
  attachment: ChatAttachment | null;
  onClose: () => void;
  onError?: (message: string) => void;
}

export const ChatAttachmentPreviewModal: React.FC<ChatAttachmentPreviewModalProps> = ({
  attachment,
  onClose,
  onError,
}) => {
  const [zoomed, setZoomed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string>('');
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  const kind = useMemo(() => (attachment ? detectAttachmentKind(attachment) : 'document'), [attachment]);
  const resolvedUrl = useMemo(() => (attachment ? resolveAttachmentUrl(attachment.url) : ''), [attachment]);
  const formatLabel = useMemo(() => (attachment ? getAttachmentFormatLabel(attachment) : 'FILE'), [attachment]);
  const canPreviewText = useMemo(
    () => (attachment ? kind === 'document' && isTextPreviewableDocument(attachment) : false),
    [attachment, kind]
  );

  // Lock body scroll & close on Escape
  useEffect(() => {
    if (!attachment) return;
    setZoomed(false);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [attachment, onClose]);

  // Convert data: URLs to Blob URLs for PDF / Audio iframe/media playback
  useEffect(() => {
    if (!attachment || !resolvedUrl) {
      setBlobPreviewUrl('');
      return;
    }

    if ((kind === 'pdf' || kind === 'audio') && resolvedUrl.startsWith('data:')) {
      try {
        const blob = dataUrlToBlob(resolvedUrl);
        const objUrl = URL.createObjectURL(blob);
        setBlobPreviewUrl(objUrl);
        return () => {
          URL.revokeObjectURL(objUrl);
        };
      } catch {
        setBlobPreviewUrl(resolvedUrl);
        return;
      }
    }

    setBlobPreviewUrl(resolvedUrl);
  }, [attachment, resolvedUrl, kind]);

  // Load text content for .txt / .csv / .json / .md documents
  useEffect(() => {
    if (!attachment || !canPreviewText) {
      setTextContent(null);
      setTextLoading(false);
      setTextError(null);
      return;
    }

    let cancelled = false;
    setTextLoading(true);
    setTextError(null);

    readTextAttachmentContent(attachment)
      .then((content) => {
        if (!cancelled) {
          setTextContent(content);
          setTextLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setTextError(err?.message || 'Could not load document preview.');
          setTextLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attachment, canPreviewText]);

  if (!attachment) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadChatAttachment(attachment);
    } catch (err: any) {
      onError?.(err?.message || 'Failed to download file.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      id="chat-attachment-preview-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#081c15]/75 backdrop-blur-xs animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-[#ced4da] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-white border-b border-[#dee2e6] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center shrink-0">
              {kind === 'image' ? (
                <ImageIcon className="w-4 h-4" />
              ) : kind === 'audio' ? (
                <Mic className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#212529] truncate" title={attachment.name}>
                {attachment.name}
              </h3>
              <p className="text-[11px] text-[#6c757d]">
                {formatLabel} &middot; {attachment.size}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {kind === 'image' && resolvedUrl && (
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                className="p-2 rounded-lg text-[#495057] hover:text-[#1b4332] hover:bg-[#d8f3dc] transition-colors cursor-pointer"
                title={zoomed ? 'Fit to screen' : 'Zoom in'}
              >
                {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </button>
            )}

            {resolvedUrl && (
              <button
                type="button"
                onClick={() => openAttachmentInNewTab(attachment)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#495057] bg-[#f8f9fa] border border-[#dee2e6] hover:bg-[#e9ecef] transition-colors cursor-pointer"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open</span>
              </button>
            )}

            {resolvedUrl && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#2d6a4f] hover:bg-[#1b4332] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Download file"
              >
                {downloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#6c757d] hover:text-[#212529] hover:bg-[#f8f9fa] transition-colors cursor-pointer"
              title="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-auto bg-[#f8f9fa] p-4 flex items-center justify-center">
          {!resolvedUrl ? (
            <div className="text-center py-12 space-y-2 text-[#6c757d]">
              <AlertCircle className="w-8 h-8 mx-auto text-[#adb5bd]" />
              <p className="text-sm font-medium text-[#212529]">File unavailable</p>
              <p className="text-xs">This attachment does not have stored file data.</p>
            </div>
          ) : kind === 'image' ? (
            <div className={`w-full h-full flex items-center justify-center ${zoomed ? 'overflow-auto' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedUrl}
                alt={attachment.name}
                onClick={() => setZoomed((z) => !z)}
                className={
                  zoomed
                    ? 'max-w-none w-auto h-auto rounded-lg shadow-lg cursor-zoom-out'
                    : 'max-h-[75vh] max-w-full object-contain rounded-lg shadow-md cursor-zoom-in'
                }
              />
            </div>
          ) : kind === 'pdf' ? (
            blobPreviewUrl ? (
              <iframe
                src={blobPreviewUrl}
                title={attachment.name}
                className="w-full h-[75vh] rounded-lg border border-[#dee2e6] bg-white shadow-xs"
              />
            ) : (
              <div className="py-12 text-center text-xs text-[#6c757d]">Preparing PDF viewer...</div>
            )
          ) : kind === 'audio' ? (
            <div className="w-full max-w-md bg-white rounded-xl border border-[#dee2e6] p-6 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center mx-auto">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#212529] break-all">{attachment.name}</p>
                <p className="text-xs text-[#6c757d] mt-0.5">{attachment.size}</p>
              </div>
              {blobPreviewUrl && (
                <audio controls src={blobPreviewUrl} className="w-full" />
              )}
            </div>
          ) : canPreviewText ? (
            <div className="w-full h-[70vh] bg-white rounded-xl border border-[#dee2e6] overflow-auto p-4">
              {textLoading ? (
                <div className="h-full flex items-center justify-center gap-2 text-xs text-[#6c757d]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2d6a4f]" />
                  <span>Loading document preview...</span>
                </div>
              ) : textError ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-xs text-rose-600">
                  <AlertCircle className="w-6 h-6" />
                  <p>{textError}</p>
                </div>
              ) : (
                <pre className="text-xs font-mono text-[#212529] whitespace-pre-wrap break-words leading-relaxed">
                  {textContent || '(Empty file)'}
                </pre>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md bg-white rounded-2xl border border-[#dee2e6] p-8 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#d8f3dc] text-[#1b4332] flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#212529] break-all">{attachment.name}</p>
                <p className="text-xs text-[#6c757d]">
                  {formatLabel} file &middot; {attachment.size}
                </p>
                <p className="text-xs text-[#6c757d] pt-1">
                  In-browser preview is not available for {formatLabel} files. Download the file to open it on your device.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => openAttachmentInNewTab(attachment)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-[#495057] bg-[#f8f9fa] border border-[#dee2e6] hover:bg-[#e9ecef] transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#2d6a4f] hover:bg-[#1b4332] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {downloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download File</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
