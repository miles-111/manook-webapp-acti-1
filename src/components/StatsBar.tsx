import React from 'react';
import { Files, HardDrive, Users, Clock } from 'lucide-react';
import { formatFileSize, formatUploadDate } from '../utils/formatters';
import { AssetFile } from '../types';

interface StatsBarProps {
  files: AssetFile[];
  totalBytes: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ files, totalBytes }) => {
  const uniqueClients = new Set(files.map((f) => f.clientName || 'General Assets')).size;
  const latestFile = files.length > 0 ? files[0] : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="rounded-xl border border-[#e6ded4] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#7a6e65]">Total Assets</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fbf5ee] text-[#a35c34]">
            <Files className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-xl font-serif font-bold text-[#2b2118]">
          {files.length}
        </div>
        <p className="text-[11px] text-[#8c7e74] mt-0.5">Cataloged in database</p>
      </div>

      <div className="rounded-xl border border-[#e6ded4] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#7a6e65]">Asset Volume</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fbf5ee] text-[#a35c34]">
            <HardDrive className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-xl font-serif font-bold text-[#2b2118]">
          {formatFileSize(totalBytes)}
        </div>
        <p className="text-[11px] text-[#8c7e74] mt-0.5">Total deliverable size</p>
      </div>

      <div className="rounded-xl border border-[#e6ded4] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#7a6e65]">Client Workspaces</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fbf5ee] text-[#a35c34]">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-xl font-serif font-bold text-[#2b2118]">
          {uniqueClients}
        </div>
        <p className="text-[11px] text-[#8c7e74] mt-0.5">Active client portals</p>
      </div>

      <div className="rounded-xl border border-[#e6ded4] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#7a6e65]">Latest Upload</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fbf5ee] text-[#a35c34]">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-base font-semibold text-[#2b2118] truncate">
          {latestFile ? latestFile.name : 'No uploads yet'}
        </div>
        <p className="text-[11px] text-[#8c7e74] mt-0.5">
          {latestFile ? formatUploadDate(latestFile.uploadedAt) : 'Ready for assets'}
        </p>
      </div>
    </div>
  );
};
