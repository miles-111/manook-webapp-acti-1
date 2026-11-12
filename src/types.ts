export interface AssetFile {
  id: string;
  userId: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  clientName?: string;
  notes?: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  role: 'freelancer' | 'client';
  createdAt: string;
}

export type ViewMode = 'list' | 'grid';

export type FileCategory = 'all' | 'images' | 'documents' | 'design' | 'archives' | 'other';

export type SortField = 'date' | 'name' | 'size';
export type SortOrder = 'asc' | 'desc';
