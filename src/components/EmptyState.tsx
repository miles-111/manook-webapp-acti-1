import React from 'react';
import { FolderArchive, UploadCloud, SearchX } from 'lucide-react';

interface EmptyStateProps {
  isSearching: boolean;
  onClearSearch: () => void;
  onUploadClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isSearching,
  onClearSearch,
  onUploadClick,
}) => {
  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e6ded4] bg-white py-14 px-6 text-center shadow-xs">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fbf5ee] text-[#a35c34]">
          <SearchX className="h-6 w-6" />
        </div>
        <h3 className="font-serif text-base font-bold text-[#2b2118]">
          No matching assets found
        </h3>
        <p className="mt-1 max-w-sm text-xs text-[#7a6e65]">
          Try refining your search terms or clearing your category filters to find what you need.
        </p>
        <button
          onClick={onClearSearch}
          className="mt-4 rounded-xl border border-[#dfd6cb] px-4 py-2 text-xs font-semibold text-[#5a4d43] hover:bg-[#f6f0e7] transition-colors cursor-pointer"
        >
          Clear filters & search
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#dfd6cb] bg-[#faf7f2] py-16 px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#efe7dd] text-[#8d4e28] shadow-xs">
        <FolderArchive className="h-7 w-7" />
      </div>
      <h3 className="font-serif text-lg font-bold text-[#2b2118]">
        Your vault is currently empty
      </h3>
      <p className="mt-1.5 max-w-md text-xs text-[#7a6e65] leading-relaxed">
        Upload your first design deliverables, client files, or creative assets to get started with AssetSilo.
      </p>
      <button
        onClick={onUploadClick}
        className="mt-5 flex items-center gap-2 rounded-xl bg-[#231710] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#34241b] transition-all cursor-pointer"
      >
        <UploadCloud className="h-4 w-4 text-[#d1945f]" />
        <span>Upload Your First File</span>
      </button>
    </div>
  );
};
