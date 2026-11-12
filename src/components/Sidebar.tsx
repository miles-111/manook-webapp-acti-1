import React from 'react';
import {
  FolderArchive,
  Layers,
  Clock,
  HardDrive,
  LogOut,
  Share2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatFileSize } from '../utils/formatters';

interface SidebarProps {
  totalFiles: number;
  totalBytes: number;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  onOpenUpload: () => void;
  onOpenShareModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  totalFiles,
  totalBytes,
  currentFilter,
  onFilterChange,
  onOpenUpload,
  onOpenShareModal,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, profile, signOutUser } = useAuth();

  const navItems = [
    { id: 'all', label: 'All Files', icon: Layers, count: totalFiles },
    { id: 'clients', label: 'Client Workspaces', icon: FolderArchive },
    { id: 'recent', label: 'Recent Uploads', icon: Clock },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-[#2d1e15] bg-[#1a120c] text-[#f4eee6] transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Branding */}
        <div>
          <div className="flex items-center justify-between border-b border-[#2d1e15] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#c68953] to-[#8d4e28] text-white shadow-md">
                <FolderArchive className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold tracking-tight text-[#fcf9f5]">
                  AssetSilo
                </h1>
                <p className="text-xs text-[#a9988b]">Client File Portal</p>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="p-4">
            <button
              onClick={() => {
                onOpenUpload();
                onCloseMobile();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#d1945f] to-[#b37441] px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-[#dd9e69] hover:to-[#be7c47] transition-all cursor-pointer active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Upload New Asset</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 px-3 py-2">
            <div className="px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wider text-[#7e6d61]">
              Portal Views
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentFilter === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onFilterChange(item.id);
                    onCloseMobile();
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#2d1e15] text-[#f9ede1] shadow-xs'
                      : 'text-[#bfb0a3] hover:bg-[#241912] hover:text-[#f4eee6]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${isActive ? 'text-[#d1945f]' : 'text-[#8c7b6f]'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-mono ${
                        isActive
                          ? 'bg-[#3d291d] text-[#e8c8ad]'
                          : 'bg-[#22160f] text-[#8c7b6f]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={() => {
                onOpenShareModal();
                onCloseMobile();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-[#bfb0a3] hover:bg-[#241912] hover:text-[#f4eee6] transition-colors cursor-pointer"
            >
              <Share2 className="h-4 w-4 text-[#8c7b6f]" />
              <span>Share Client Link</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section: Managed Assets & User Account */}
        <div className="border-t border-[#2d1e15] p-4 space-y-4">
          {/* Managed Assets Volume Widget */}
          <div className="rounded-xl border border-[#2d1e15] bg-[#22160f] p-3.5 text-xs">
            <div className="flex items-center justify-between text-[#d6c9be] mb-2 font-medium">
              <div className="flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-[#d1945f]" />
                <span>Managed Assets</span>
              </div>
              <span className="font-mono text-[#a9988b]">{totalFiles} items</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#8c7e74]">
              <span>Volume</span>
              <span className="font-mono text-[#d6c9be]">{formatFileSize(totalBytes)}</span>
            </div>
          </div>

          {/* User Account & Sign Out */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#34241b] text-sm font-semibold text-[#f4eee6] border border-[#483326]">
                {profile?.displayName
                  ? profile.displayName.charAt(0).toUpperCase()
                  : user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-[#fcf9f5]">
                  {profile?.displayName || 'User'}
                </div>
                <div className="truncate text-[11px] text-[#8c7e74]">
                  {user?.email || 'Authenticated'}
                </div>
              </div>
            </div>

            <button
              onClick={() => signOutUser()}
              title="Sign Out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#a9988b] hover:bg-[#2d1e15] hover:text-[#f87171] transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
