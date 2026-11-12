import { getLocalFileUrl } from './localFileStore';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

export function formatUploadDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Recently';
  }
}

export interface FileTypeInfo {
  category: 'images' | 'documents' | 'design' | 'archives' | 'other';
  label: string;
  badgeBg: string;
  badgeText: string;
  iconName: 'image' | 'file-text' | 'figma' | 'archive' | 'file';
}

export function getFileTypeInfo(fileName: string, mimeType?: string): FileTypeInfo {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif'].includes(ext)) {
    return {
      category: 'images',
      label: ext.toUpperCase(),
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeText: 'text-emerald-700',
      iconName: 'image',
    };
  }

  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'md', 'csv', 'xlsx'].includes(ext)) {
    return {
      category: 'documents',
      label: ext.toUpperCase(),
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeText: 'text-amber-700',
      iconName: 'file-text',
    };
  }

  if (['fig', 'sketch', 'xd', 'psd', 'ai', 'eps', 'indd'].includes(ext)) {
    return {
      category: 'design',
      label: ext.toUpperCase(),
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      badgeText: 'text-purple-700',
      iconName: 'figma',
    };
  }

  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return {
      category: 'archives',
      label: ext.toUpperCase(),
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
      badgeText: 'text-blue-700',
      iconName: 'archive',
    };
  }

  return {
    category: 'other',
    label: ext ? ext.toUpperCase() : 'FILE',
    badgeBg: 'bg-stone-100 text-stone-800 border-stone-200',
    badgeText: 'text-stone-700',
    iconName: 'file',
  };
}

export function downloadFile(name: string, clientName?: string) {
  // Check if we have the file in browser local memory
  const localUrl = getLocalFileUrl(name);
  if (localUrl) {
    triggerDownload(localUrl, name);
    return;
  }

  // Otherwise, create a clean deliverable document bundle for client export
  const content = `AssetSilo Portal Deliverable Package
File Name: ${name}
Workspace: ${clientName || 'General Assets'}
Export Timestamp: ${new Date().toLocaleString()}
Status: Verified by Designer / Freelancer
`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, name.endsWith('.txt') ? name : `${name}.txt`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
