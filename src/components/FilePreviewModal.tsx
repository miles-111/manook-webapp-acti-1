import React from 'react';
import {
  X,
  Download,
  Calendar,
  HardDrive,
  Folder,
  FileText,
  Share2,
  MessageSquare,
} from 'lucide-react';
import { AssetFile } from '../types';
import { formatFileSize, formatUploadDate, getFileTypeInfo } from '../utils/formatters';
import { getLocalFileUrl } from '../utils/localFileStore';

interface FilePreviewModalProps {
  file: AssetFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: AssetFile) => void;
  onShare: (file: AssetFile) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
  onShare,
}) => {
  if (!isOpen || !file) return null;

  const typeInfo = getFileTypeInfo(file.name, file.type);
  const localUrl = getLocalFileUrl(file.name);
  const isImage = typeInfo.category === 'images' && !!localUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#e6ded4] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#ece4d9] bg-[#faf7f2] px-6 py-4">
          <div className="min-w-0 pr-4">
            <h3 className="truncate text-base font-serif font-bold text-[#2b2118]" title={file.name}>
              {file.name}
            </h3>
            <p className="text-xs text-[#7a6e65]">
              Uploaded {formatUploadDate(file.uploadedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8c7e74] hover:bg-[#efe7dd] hover:text-[#2b2118] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Preview Zone */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Visual Preview */}
          <div className="flex min-h-[220px] max-h-[380px] w-full items-center justify-center rounded-xl border border-[#e6ded4] bg-[#f7f2ea] overflow-hidden">
            {isImage ? (
              <img
                src={localUrl!}
                alt={file.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl border mb-3 ${typeInfo.badgeBg}`}
                >
                  <FileText className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold text-[#2b2118]">{file.name}</p>
                <p className="mt-1 text-xs text-[#8c7e74]">
                  Deliverable asset metadata registered in Firestore database
                </p>
              </div>
            )}
          </div>

          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-[#ece4d9] bg-[#faf7f2] p-3">
              <span className="flex items-center gap-1.5 text-[#8c7e74] mb-1 font-medium">
                <HardDrive className="h-3.5 w-3.5 text-[#b8764a]" />
                File Size
              </span>
              <span className="font-mono font-semibold text-[#2b2118]">
                {formatFileSize(file.size)}
              </span>
            </div>

            <div className="rounded-xl border border-[#ece4d9] bg-[#faf7f2] p-3">
              <span className="flex items-center gap-1.5 text-[#8c7e74] mb-1 font-medium">
                <Folder className="h-3.5 w-3.5 text-[#b8764a]" />
                Workspace
              </span>
              <span className="font-semibold text-[#2b2118] truncate block">
                {file.clientName || 'General Assets'}
              </span>
            </div>

            <div className="rounded-xl border border-[#ece4d9] bg-[#faf7f2] p-3 col-span-2 sm:col-span-1">
              <span className="flex items-center gap-1.5 text-[#8c7e74] mb-1 font-medium">
                <Calendar className="h-3.5 w-3.5 text-[#b8764a]" />
                File Format
              </span>
              <span className="font-mono font-semibold text-[#2b2118]">
                {typeInfo.label}
              </span>
            </div>
          </div>

          {/* Notes if present */}
          {file.notes && (
            <div className="rounded-xl border border-[#ece4d9] bg-[#fffdfa] p-4 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-[#5a4d43] mb-1">
                <MessageSquare className="h-3.5 w-3.5 text-[#b8764a]" />
                Designer / Client Notes
              </span>
              <p className="text-[#3b3027] leading-relaxed whitespace-pre-wrap">
                {file.notes}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#ece4d9] bg-[#faf7f2] px-6 py-3.5">
          <button
            onClick={() => onShare(file)}
            className="flex items-center gap-1.5 rounded-xl border border-[#dfd6cb] px-3.5 py-2 text-xs font-semibold text-[#5a4d43] hover:bg-[#f6f0e7] transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-[#8c7e74]" />
            <span>Share Link</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-[#dfd6cb] px-4 py-2 text-xs font-semibold text-[#5a4d43] hover:bg-[#f6f0e7] transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 rounded-xl bg-[#231710] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#34241b] transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#d1945f]" />
              <span>Download Deliverable</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
