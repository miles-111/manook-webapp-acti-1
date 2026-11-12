import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AssetFile, FileCategory, SortField, SortOrder, ViewMode } from './types';
import { Sidebar } from './components/Sidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { StatsBar } from './components/StatsBar';
import { UploadZone } from './components/UploadZone';
import { FileList } from './components/FileList';
import { FileGrid } from './components/FileGrid';
import { FilePreviewModal } from './components/FilePreviewModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { SharePortalModal } from './components/SharePortalModal';
import { EmptyState } from './components/EmptyState';
import { AuthView } from './components/AuthView';
import { downloadFile, getFileTypeInfo } from './utils/formatters';
import { removeLocalFile } from './utils/localFileStore';
import { Sparkles, Loader2 } from 'lucide-react';

const MainPortal: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();

  const [files, setFiles] = useState<AssetFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [previewFile, setPreviewFile] = useState<AssetFile | null>(null);
  const [fileToDelete, setFileToDelete] = useState<AssetFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareFile, setShareFile] = useState<AssetFile | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Real-time Firestore sync with strict security rule query
  useEffect(() => {
    if (!user) {
      setFiles([]);
      setLoadingFiles(false);
      return;
    }

    setLoadingFiles(true);
    const filesCollectionRef = collection(db, 'files');
    const q = query(filesCollectionRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: AssetFile[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...(docSnap.data() as Omit<AssetFile, 'id'>) });
        });
        setFiles(loaded);
        setLoadingFiles(false);
      },
      (error) => {
        setLoadingFiles(false);
        handleFirestoreError(error, OperationType.LIST, 'files');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Derived metrics & clients
  const clientsList = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => {
      if (f.clientName) set.add(f.clientName);
    });
    return Array.from(set).sort();
  }, [files]);

  const totalBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.size || 0), 0);
  }, [files]);

  // Filtered & sorted files
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.clientName && f.clientName.toLowerCase().includes(q)) ||
          (f.notes && f.notes.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((f) => {
        const info = getFileTypeInfo(f.name, f.type);
        return info.category === selectedCategory;
      });
    }

    // Client filter
    if (selectedClient !== 'all') {
      result = result.filter((f) => (f.clientName || 'General Assets') === selectedClient);
    }

    // Sort order
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'size') {
        comparison = (b.size || 0) - (a.size || 0);
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return result;
  }, [files, searchQuery, selectedCategory, selectedClient, sortField, sortOrder]);

  // Upload handler - stores metadata in Firestore database
  const handleUploadFile = async (fileData: {
    name: string;
    size: number;
    type: string;
    clientName?: string;
    notes?: string;
  }) => {
    if (!user) return;

    const fileDocRef = doc(collection(db, 'files'));
    const newDoc: Omit<AssetFile, 'id'> = {
      userId: user.uid,
      name: fileData.name,
      size: fileData.size,
      type: fileData.type,
      uploadedAt: new Date().toISOString(),
      ...(fileData.clientName ? { clientName: fileData.clientName } : {}),
      ...(fileData.notes ? { notes: fileData.notes } : {}),
    };

    try {
      await setDoc(fileDocRef, newDoc);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `files/${fileDocRef.id}`);
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!fileToDelete || !user) return;

    setIsDeleting(true);
    const targetPath = `files/${fileToDelete.id}`;
    try {
      await deleteDoc(doc(db, 'files', fileToDelete.id));
      removeLocalFile(fileToDelete.name);
      setFileToDelete(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, targetPath);
    } finally {
      setIsDeleting(false);
    }
  };

  // Download handler
  const handleDownload = (file: AssetFile) => {
    downloadFile(file.name, file.clientName);
  };

  // Seed sample assets for immediate evaluation
  const handleSeedSamples = async () => {
    if (!user) return;
    const sampleItems = [
      {
        name: 'Brand_Identity_Guidelines_v2.pdf',
        size: 3420000,
        type: 'application/pdf',
        clientName: 'Acme Studio',
        notes: 'Final vector brand bible with CMYK and Pantone palettes for print production.',
      },
      {
        name: 'Hero_Visual_Keyframe.png',
        size: 1850000,
        type: 'image/png',
        clientName: 'Vogue Q4',
        notes: 'Retouched photography hero deliverable at 300 DPI.',
      },
      {
        name: 'Mobile_App_Design_Tokens.fig',
        size: 4900000,
        type: 'application/octet-stream',
        clientName: 'Fintech Portal',
        notes: 'Figma export package containing design token specs and layout components.',
      },
      {
        name: 'Campaign_Press_Assets.zip',
        size: 8200000,
        type: 'application/zip',
        clientName: 'Acme Studio',
        notes: 'Packaged press kit, logos, and high-res lifestyle imagery.',
      },
    ];

    for (const sample of sampleItems) {
      await handleUploadFile(sample);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#faf7f2]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#a35c34]" />
          <p className="font-serif text-sm font-semibold text-[#2b2118]">
            Loading AssetSilo...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#fbf9f5] font-sans text-[#2b2118]">
      {/* Espresso Brown Sidebar */}
      <Sidebar
        totalFiles={files.length}
        totalBytes={totalBytes}
        currentFilter={selectedClient !== 'all' ? 'clients' : 'all'}
        onFilterChange={(filter) => {
          if (filter === 'all') {
            setSelectedClient('all');
            setSelectedCategory('all');
          } else if (filter === 'recent') {
            setSortField('date');
            setSortOrder('desc');
          }
        }}
        onOpenUpload={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenShareModal={() => {
          setShareFile(null);
          setIsShareModalOpen(true);
        }}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area - Soft Cream & Light Warm Taupe */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 md:px-10 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header & Controls */}
          <DashboardHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedClient={selectedClient}
            onClientChange={setSelectedClient}
            clientsList={clientsList}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortChange={(field, order) => {
              setSortField(field);
              setSortOrder(order);
            }}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          {/* Stats Bar */}
          <StatsBar files={files} totalBytes={totalBytes} />

          {/* Quick Upload Zone */}
          <UploadZone
            onUpload={handleUploadFile}
            clientsList={clientsList}
          />

          {/* Files List / Grid Header */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h2 className="text-base font-serif font-bold text-[#2b2118]">
                Vault Assets ({filteredFiles.length})
              </h2>
              <p className="text-xs text-[#7a6e65]">
                {selectedClient !== 'all'
                  ? `Showing deliverables for workspace "${selectedClient}"`
                  : 'All client deliverables & creative assets'}
              </p>
            </div>

            {files.length === 0 && (
              <button
                onClick={handleSeedSamples}
                className="flex items-center gap-1.5 rounded-xl border border-[#dfd6cb] bg-white px-3 py-1.5 text-xs font-semibold text-[#8d4e28] shadow-2xs hover:bg-[#faf7f2] transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#d1945f]" />
                <span>Load Sample Client Assets</span>
              </button>
            )}
          </div>

          {/* Files Content */}
          {loadingFiles ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#a35c34]" />
                <p className="text-xs text-[#7a6e65]">Syncing client vault...</p>
              </div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <EmptyState
              isSearching={!!searchQuery || selectedCategory !== 'all' || selectedClient !== 'all'}
              onClearSearch={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedClient('all');
              }}
              onUploadClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : viewMode === 'list' ? (
            <FileList
              files={filteredFiles}
              onDownload={handleDownload}
              onPreview={(file) => setPreviewFile(file)}
              onDelete={(file) => setFileToDelete(file)}
              onShare={(file) => {
                setShareFile(file);
                setIsShareModalOpen(true);
              }}
            />
          ) : (
            <FileGrid
              files={filteredFiles}
              onDownload={handleDownload}
              onPreview={(file) => setPreviewFile(file)}
              onDelete={(file) => setFileToDelete(file)}
              onShare={(file) => {
                setShareFile(file);
                setIsShareModalOpen(true);
              }}
            />
          )}
        </div>
      </main>

      {/* Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
        onShare={(file) => {
          setShareFile(file);
          setIsShareModalOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        file={fileToDelete}
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* Share Client Link Modal */}
      <SharePortalModal
        file={shareFile}
        clientName={selectedClient !== 'all' ? selectedClient : undefined}
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareFile(null);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainPortal />
    </AuthProvider>
  );
}
