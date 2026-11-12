import React from 'react';
import {
  Download,
  Trash2,
  Eye,
  Share2,
  FileText,
  Image as ImageIcon,
  Archive,
  Layers,
  File,
  MessageSquare,
} from 'lucide-react';
import { AssetFile } from '../types';
import { formatFileSize, formatUploadDate, getFileTypeInfo } from '../utils/formatters';
import { getLocalFileUrl } from '../utils/localFileStore';

interface FileGridProps {
  files: AssetFile[];
  onDownload: (file: AssetFile) => void;
  onPreview: (file: AssetFile) => void;
  onDelete: (file: AssetFile) => void;
  onShare: (file: AssetFile) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  onDownload,
  onPreview,
  onDelete,
  onShare,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'image':
        return <ImageIcon className="h-7 w-7" />;
      case 'file-text':
        return <FileText className="h-7 w-7" />;
      case 'figma':
        return <Layers className="h-7 w-7" />;
      case 'archive':
        return <Archive className="h-7 w-7" />;
      default:
        return <File className="h-7 w-7" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => {
        const typeInfo = getFileTypeInfo(file.name, file.type);
        const localUrl = getLocalFileUrl(file.name);
        const isLocalImage = typeInfo.category === 'images' && !!localUrl;

        return (
          <div
            key={file.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e6ded4] bg-white transition-all hover:border-[#cbbfb2] hover:shadow-md"
          >
            {/* Thumbnail / Header Preview */}
            <div
              onClick={() => onPreview(file)}
              className="relative flex h-36 w-full items-center justify-center bg-[#f7f2ea] overflow-hidden cursor-pointer"
            >
              {isLocalImage ? (
                <img
                  src={localUrl!}
                  alt={file.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl border shadow-2xs ${typeInfo.badgeBg}`}
                >
                  {getIcon(typeInfo.iconName)}
                </div>
              )}

              {/* Type Badge */}
              <div className="absolute top-3 left-3">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-xs border ${typeInfo.badgeBg}`}
                >
                  {typeInfo.label}
                </span>
              </div>

              {/* Hover Quick Actions */}
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(file);
                  }}
                  title="Preview"
                  className="rounded-lg bg-white/90 p-1.5 text-[#2b2118] shadow-xs hover:bg-white transition-colors cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(file);
                  }}
                  title="Download"
                  className="rounded-lg bg-white/90 p-1.5 text-[#2b2118] shadow-xs hover:bg-white transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Content Details */}
            <div className="flex flex-1 flex-col justify-between p-4">
              <div>
                <p
                  onClick={() => onPreview(file)}
                  className="truncate font-semibold text-[#2b2118] hover:text-[#a35c34] cursor-pointer text-sm"
                  title={file.name}
                >
                  {file.name}
                </p>

                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-block truncate rounded-md bg-[#f4ede4] px-2 py-0.5 text-[11px] font-medium text-[#5e4f44]">
                    {file.clientName || 'General Assets'}
                  </span>
                </div>

                {file.notes && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-[#8c7e74] line-clamp-1">
                    <MessageSquare className="h-3 w-3 shrink-0 text-[#b5a79b]" />
                    <span>{file.notes}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#f2ebe2] pt-3 text-xs text-[#7a6e65]">
                <span className="font-mono">{formatFileSize(file.size)}</span>
                <span>{formatUploadDate(file.uploadedAt)}</span>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="flex items-center justify-between border-t border-[#ece4d9] bg-[#faf7f2] px-4 py-2">
              <button
                onClick={() => onShare(file)}
                className="flex items-center gap-1 text-xs font-medium text-[#7a6e65] hover:text-[#2b2118] cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDownload(file)}
                  className="rounded-md p-1.5 text-[#7a6e65] hover:bg-white hover:text-[#2b2118] transition-colors cursor-pointer"
                  title="Download File"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(file)}
                  className="rounded-md p-1.5 text-[#7a6e65] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                  title="Delete File"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
