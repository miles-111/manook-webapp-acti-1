import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { AssetFile } from '../types';
import { formatFileSize } from '../utils/formatters';

interface DeleteConfirmModalProps {
  file: AssetFile | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  file,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-[#e6ded4] bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 rounded-lg p-1 text-[#8c7e74] hover:bg-[#f6f0e7] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-[#2b2118]">
              Delete this file?
            </h3>
            <p className="text-xs text-[#7a6e65]">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[#ece4d9] bg-[#faf7f2] p-3.5 mb-5 text-xs">
          <p className="font-semibold text-[#2b2118] truncate">{file.name}</p>
          <p className="text-[#8c7e74] mt-0.5">
            {formatFileSize(file.size)} • {file.clientName || 'General Assets'}
          </p>
        </div>

        <p className="text-xs text-[#695c52] leading-relaxed mb-6">
          Removing this file will delete its record from your AssetSilo vault. Your clients will no longer have access to download this asset.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-[#dfd6cb] px-4 py-2 text-xs font-semibold text-[#5a4d43] hover:bg-[#f6f0e7] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete File'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
