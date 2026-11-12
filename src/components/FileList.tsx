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

interface FileListProps {
  files: AssetFile[];
  onDownload: (file: AssetFile) => void;
  onPreview: (file: AssetFile) => void;
  onDelete: (file: AssetFile) => void;
  onShare: (file: AssetFile) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onDownload,
  onPreview,
  onDelete,
  onShare,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'file-text':
        return <FileText className="h-4 w-4" />;
      case 'figma':
        return <Layers className="h-4 w-4" />;
      case 'archive':
        return <Archive className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e6ded4] bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#ece4d9] bg-[#faf7f2] text-xs font-semibold uppercase tracking-wider text-[#7a6e65]">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                File Name
              </th>
              <th scope="col" className="px-4 py-3.5">
                Client / Project
              </th>
              <th scope="col" className="px-4 py-3.5">
                File Size
              </th>
              <th scope="col" className="px-4 py-3.5">
                Upload Date
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2ebe2] text-[#2b2118]">
            {files.map((file) => {
              const typeInfo = getFileTypeInfo(file.name, file.type);

              return (
                <tr
                  key={file.id}
                  className="group hover:bg-[#fbf9f6] transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${typeInfo.badgeBg}`}
                      >
                        {getIcon(typeInfo.iconName)}
                      </div>
                      <div className="min-w-0 max-w-xs md:max-w-md">
                        <div className="flex items-center gap-2">
                          <p
                            onClick={() => onPreview(file)}
                            className="truncate font-semibold text-[#2b2118] hover:text-[#a35c34] cursor-pointer"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wide border ${typeInfo.badgeBg}`}
                          >
                            {typeInfo.label}
                          </span>
                        </div>
                        {file.notes && (
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#8c7e74]">
                            <MessageSquare className="h-3 w-3 shrink-0 text-[#b5a79b]" />
                            <span className="truncate">{file.notes}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-lg bg-[#f4ede4] px-2.5 py-1 text-xs font-medium text-[#5e4f44]">
                      {file.clientName || 'General Assets'}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-xs font-mono text-[#5a4d43]">
                    {formatFileSize(file.size)}
                  </td>

                  <td className="px-4 py-4 text-xs text-[#7a6e65]">
                    {formatUploadDate(file.uploadedAt)}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onPreview(file)}
                        title="Preview & Details"
                        className="rounded-lg p-2 text-[#7a6e65] hover:bg-[#f4efe8] hover:text-[#2b2118] transition-colors cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onDownload(file)}
                        title="Download File"
                        className="rounded-lg p-2 text-[#7a6e65] hover:bg-[#f4efe8] hover:text-[#2b2118] transition-colors cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onShare(file)}
                        title="Share with Client"
                        className="rounded-lg p-2 text-[#7a6e65] hover:bg-[#f4efe8] hover:text-[#2b2118] transition-colors cursor-pointer"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onDelete(file)}
                        title="Delete File"
                        className="rounded-lg p-2 text-[#7a6e65] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
