import React from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Menu,
  SlidersHorizontal,
  Folder,
  ArrowUpDown,
} from 'lucide-react';
import { FileCategory, SortField, SortOrder, ViewMode } from '../types';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: FileCategory;
  onCategoryChange: (category: FileCategory) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedClient: string;
  onClientChange: (client: string) => void;
  clientsList: string[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  onOpenMobileMenu: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  viewMode,
  onViewModeChange,
  selectedClient,
  onClientChange,
  clientsList,
  sortField,
  sortOrder,
  onSortChange,
  onOpenMobileMenu,
}) => {
  const categories: { id: FileCategory; label: string }[] = [
    { id: 'all', label: 'All Assets' },
    { id: 'images', label: 'Images' },
    { id: 'documents', label: 'Documents' },
    { id: 'design', label: 'Design' },
    { id: 'archives', label: 'Archives' },
  ];

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6ded4] bg-white text-[#2b2118] md:hidden cursor-pointer"
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#2b2118]">
              Client Asset Vault
            </h1>
            <p className="text-xs text-[#7a6e65]">
              Secure deliverables and client collaboration hub
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64 md:w-72">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9e9084]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search assets, clients, notes..."
              className="w-full rounded-xl border border-[#dfd6cb] bg-white pl-9 pr-3.5 py-2 text-xs text-[#2b2118] placeholder-[#9e9084] focus:border-[#a35c34] focus:outline-hidden"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-xl border border-[#dfd6cb] bg-white p-1">
            <button
              onClick={() => onViewModeChange('list')}
              className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#231710] text-white shadow-xs'
                  : 'text-[#7a6e65] hover:text-[#2b2118]'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#231710] text-white shadow-xs'
                  : 'text-[#7a6e65] hover:text-[#2b2118]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and sorting row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#e6ded4] py-3 text-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#231710] text-white shadow-xs'
                  : 'bg-white border border-[#dfd6cb] text-[#5e4f44] hover:bg-[#faf7f2]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Client & Sorting dropdowns */}
        <div className="flex items-center gap-2">
          {/* Workspace select */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#dfd6cb] bg-white px-2.5 py-1.5 text-xs text-[#5e4f44]">
            <Folder className="h-3.5 w-3.5 text-[#b8764a]" />
            <select
              value={selectedClient}
              onChange={(e) => onClientChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#2b2118] focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Workspaces</option>
              {clientsList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#dfd6cb] bg-white px-2.5 py-1.5 text-xs text-[#5e4f44]">
            <ArrowUpDown className="h-3.5 w-3.5 text-[#b8764a]" />
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('-');
                onSortChange(f as SortField, o as SortOrder);
              }}
              className="bg-transparent text-xs font-medium text-[#2b2118] focus:outline-hidden cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-desc">Largest Size</option>
              <option value="size-asc">Smallest Size</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
