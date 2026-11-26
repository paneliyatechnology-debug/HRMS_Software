'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Eye,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Image as ImageIcon,
  Mic,
  Play,
  Pause,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ChatAttachment } from '../../types/hrms';
import {
  detectAttachmentKind,
  resolveAttachmentUrl,
  getAttachmentFormatLabel,
  formatAudioDuration,
  dataUrlToBlob,
  downloadChatAttachment,
} from '../../lib/chatMediaUtils';

interface ChatAttachmentCardProps {
  attachment: ChatAttachment;
  isMe: boolean;
  onPreview: (attachment: ChatAttachment) => void;
  onError?: (message: string) => void;
}

const ChatAudioPlayer: React.FC<{
  attachment: ChatAttachment;
  resolvedUrl: string;
  isMe: boolean;
  onDownload: () => void;
  downloading: boolean;
}> = ({ attachment, resolvedUrl, isMe, onDownload, downloading }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playableSrc, setPlayableSrc] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(attachment.duration || 0);
  const [loadError, setLoadError] = useState(false);

  // Convert data:audio URLs to Blob URLs for smooth playback and seeking across all browsers
  useEffect(() => {
    setLoadError(false);
    setIsPlaying(false);
    setCurrentTime(0);

    if (!resolvedUrl) {
      setPlayableSrc('');
      return;
    }

    if (resolvedUrl.startsWith('data:')) {
      try {
        const blob = dataUrlToBlob(resolvedUrl);
        const objUrl = URL.createObjectURL(blob);
        setPlayableSrc(objUrl);
        return () => {
          URL.revokeObjectURL(objUrl);
        };
      } catch {
        setPlayableSrc(resolvedUrl);
        return;
      }
    }

    setPlayableSrc(resolvedUrl);
  }, [resolvedUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !playableSrc) return;
    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch {
      setLoadError(true);
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const nextTime = Number(e.target.value);
    if (audio && Number.isFinite(nextTime)) {
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const effectiveDuration = duration > 0 ? duration : attachment.duration || 0;
  const progressPercent = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;

  return (
    <div
      className={`rounded-xl border p-2.5 min-w-[230px] sm:min-w-[265px] max-w-full ${
        isMe
          ? 'bg-white/12 border-white/20 text-white'
          : 'bg-[#f8f9fa] border-[#dee2e6] text-[#212529]'
      }`}
    >
      {playableSrc && (
        <audio
          ref={audioRef}
          src={playableSrc}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) setDuration(d);
          }}
          onTimeUpdate={(e) => {
            setCurrentTime(e.currentTarget.currentTime);
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0 && d !== duration) setDuration(d);
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onError={() => setLoadError(true)}
          className="hidden"
        />
      )}

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          disabled={!playableSrc || loadError}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
            isMe
              ? 'bg-white text-[#1b4332] hover:bg-[#d8f3dc]'
              : 'bg-[#2d6a4f] text-white hover:bg-[#1b4332]'
          }`}
          title={isPlaying ? 'Pause voice note' : 'Play voice note'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold truncate ${
                isMe ? 'text-white' : 'text-[#212529]'
              }`}
            >
              <Mic className="w-3 h-3 shrink-0 opacity-85" />
              <span className="truncate">{attachment.name || 'Voice note'}</span>
            </span>
          </div>

          {/* Seek Bar */}
          <div className="relative flex items-center h-4">
            <div
              className={`w-full h-1.5 rounded-full overflow-hidden ${
                isMe ? 'bg-white/25' : 'bg-[#dee2e6]'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  isMe ? 'bg-[#d8f3dc]' : 'bg-[#2d6a4f]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={effectiveDuration || 1}
              step={0.1}
              value={Math.min(currentTime, effectiveDuration || 1)}
              onChange={handleSeek}
              disabled={!playableSrc || loadError || effectiveDuration <= 0}
              aria-label="Seek audio"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
            />
          </div>

          <div
            className={`flex items-center justify-between text-[10px] ${
              isMe ? 'text-[#d8f3dc]' : 'text-[#6c757d]'
            }`}
          >
            <span>
              {formatAudioDuration(currentTime)}
              {effectiveDuration > 0 ? ` / ${formatAudioDuration(effectiveDuration)}` : ''}
            </span>
            <span>{attachment.size}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className={`p-2 rounded-full shrink-0 transition-colors cursor-pointer disabled:opacity-50 ${
            isMe
              ? 'bg-white/15 hover:bg-white/25 text-white'
              : 'bg-white hover:bg-[#d8f3dc] text-[#1b4332] border border-[#dee2e6]'
          }`}
          title="Download audio"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {loadError && (
        <p className={`mt-1.5 text-[10px] flex items-center gap-1 ${isMe ? 'text-amber-200' : 'text-rose-600'}`}>
          <AlertCircle className="w-3 h-3 shrink-0" />
          Unable to play this audio format in browser. Try downloading.
        </p>
      )}
    </div>
  );
};

export const ChatAttachmentCard: React.FC<ChatAttachmentCardProps> = ({
  attachment,
  isMe,
  onPreview,
  onError,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);

  const kind = useMemo(() => detectAttachmentKind(attachment), [attachment]);
  const resolvedUrl = useMemo(() => resolveAttachmentUrl(attachment.url), [attachment.url]);
  const formatLabel = useMemo(() => getAttachmentFormatLabel(attachment), [attachment]);

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!resolvedUrl) return;
    setDownloading(true);
    try {
      await downloadChatAttachment(attachment);
    } catch (err: any) {
      onError?.(err?.message || 'Failed to download file.');
    } finally {
      setDownloading(false);
    }
  };

  // Legacy message without stored file URL
  if (!resolvedUrl) {
    return (
      <div
        className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs border ${
          isMe
            ? 'bg-white/10 border-white/20 text-white'
            : 'bg-[#f8f9fa] border-[#dee2e6] text-[#212529]'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            isMe ? 'bg-white/15 text-[#d8f3dc]' : 'bg-[#e9ecef] text-[#495057]'
          }`}
        >
          {kind === 'image' ? (
            <ImageIcon className="w-4 h-4" />
          ) : kind === 'audio' ? (
            <Mic className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs font-semibold ${isMe ? 'text-white' : 'text-[#212529]'}`}>{attachment.name}</p>
          <p className={`text-[10px] ${isMe ? 'text-[#d8f3dc]/85' : 'text-[#6c757d]'}`}>
            {attachment.size} &middot; Preview unavailable (legacy message)
          </p>
        </div>
      </div>
    );
  }

  // 1. IMAGE ATTACHMENT
  if (kind === 'image') {
    return (
      <div
        className={`rounded-xl overflow-hidden border max-w-[280px] sm:max-w-[320px] ${
          isMe
            ? 'bg-white/10 border-white/20 text-white'
            : 'bg-[#f8f9fa] border-[#dee2e6] text-[#212529]'
        }`}
      >
        {!imageBroken ? (
          <button
            type="button"
            onClick={() => onPreview(attachment)}
            className="block w-full relative group/img overflow-hidden bg-black/5 cursor-pointer text-left"
            title="Click to view full photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedUrl}
              alt={attachment.name || 'Chat photo'}
              onError={() => setImageBroken(true)}
              className="w-full max-h-60 object-cover transition-transform duration-200 group-hover/img:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover/img:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#081c15]/85 text-white text-[11px] font-semibold shadow-md">
                <Eye className="w-3.5 h-3.5" />
                View Photo
              </span>
            </div>
          </button>
        ) : (
          <div className="p-4 text-center space-y-1">
            <ImageIcon className="w-6 h-6 mx-auto opacity-60" />
            <p className={`text-[11px] opacity-85 ${isMe ? 'text-white' : 'text-[#495057]'}`}>Image preview could not load</p>
          </div>
        )}

        <div
          className={`px-2.5 py-2 flex items-center justify-between gap-2 border-t ${
            isMe ? 'border-white/15 bg-[#1b4332]/40' : 'border-[#dee2e6] bg-white'
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className={`truncate text-[11px] font-semibold ${isMe ? 'text-white' : 'text-[#212529]'}`}>{attachment.name}</p>
            <p className={`text-[10px] ${isMe ? 'text-[#d8f3dc]' : 'text-[#6c757d]'}`}>
              {formatLabel} &middot; {attachment.size}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onPreview(attachment)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                isMe
                  ? 'bg-white/15 hover:bg-white/25 text-white'
                  : 'bg-[#f8f9fa] hover:bg-[#d8f3dc] text-[#1b4332] border border-[#dee2e6]'
              }`}
              title="View full photo"
            >
              <Eye className="w-3 h-3" />
              <span>View</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                isMe
                  ? 'bg-white text-[#1b4332] hover:bg-[#d8f3dc]'
                  : 'bg-[#2d6a4f] text-white hover:bg-[#1b4332]'
              }`}
              title="Download photo"
            >
              {downloading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUDIO / VOICE NOTE ATTACHMENT
  if (kind === 'audio') {
    return (
      <ChatAudioPlayer
        attachment={attachment}
        resolvedUrl={resolvedUrl}
        isMe={isMe}
        onDownload={() => handleDownload()}
        downloading={downloading}
      />
    );
  }

  // 3. PDF & DOCUMENT ATTACHMENTS
  const isSpreadsheet = ['XLS', 'XLSX', 'CSV'].includes(formatLabel);
  const DocIcon = kind === 'pdf' ? FileText : isSpreadsheet ? FileSpreadsheet : FileIcon;

  return (
    <div
      className={`rounded-xl border p-2.5 min-w-[230px] sm:min-w-[270px] max-w-[320px] space-y-2 ${
        isMe
          ? 'bg-white/12 border-white/20 text-white'
          : 'bg-[#f8f9fa] border-[#dee2e6] text-[#212529]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`px-2 py-1.5 rounded-lg flex flex-col items-center justify-center shrink-0 min-w-[42px] border ${
            kind === 'pdf'
              ? isMe
                ? 'bg-rose-500/25 border-rose-300/40 text-white'
                : 'bg-rose-50 border-rose-200 text-rose-700'
              : isMe
                ? 'bg-white/15 border-white/25 text-[#d8f3dc]'
                : 'bg-[#d8f3dc] border-[#95d5b2] text-[#1b4332]'
          }`}
        >
          <DocIcon className="w-4 h-4" />
          <span className="text-[9px] font-bold tracking-wide mt-0.5 leading-none">{formatLabel.slice(0, 4)}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs font-semibold ${isMe ? 'text-white' : 'text-[#212529]'}`} title={attachment.name}>
            {attachment.name}
          </p>
          <p className={`text-[10px] mt-0.5 ${isMe ? 'text-[#d8f3dc]' : 'text-[#6c757d]'}`}>
            {kind === 'pdf' ? 'PDF Document' : `${formatLabel} Document`} &middot; {attachment.size}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPreview(attachment)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
            isMe
              ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              : 'bg-white hover:bg-[#d8f3dc] text-[#1b4332] border border-[#dee2e6]'
          }`}
          title="View document"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
            isMe
              ? 'bg-white text-[#1b4332] hover:bg-[#d8f3dc]'
              : 'bg-[#2d6a4f] text-white hover:bg-[#1b4332]'
          }`}
          title="Download document"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>Download</span>
        </button>
      </div>
    </div>
  );
};
