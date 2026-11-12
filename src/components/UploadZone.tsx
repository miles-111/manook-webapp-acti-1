import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';
import { registerLocalFile } from '../utils/localFileStore';

interface UploadZoneProps {
  onUpload: (fileData: {
    name: string;
    size: number;
    type: string;
    clientName?: string;
    notes?: string;
  }) => Promise<void>;
  clientsList: string[];
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload, clientsList }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setErrorMessage(null);
    setUploadSuccess(false);
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Register file locally in browser memory for instant download/preview
      registerLocalFile(selectedFile.name, selectedFile);

      // Save file metadata directly to Firestore database
      await onUpload({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type || 'application/octet-stream',
        clientName: clientName.trim() || 'General Assets',
        notes: notes.trim() || undefined,
      });

      setUploadSuccess(true);
      setSelectedFile(null);
      setNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err?.message || 'Could not complete upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="rounded-2xl border border-[#e6ded4] bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-serif font-bold text-[#2b2118]">
            Quick Asset Upload
          </h2>
          <p className="text-xs text-[#7a6e65]">
            Drag and drop client files or design deliverables
          </p>
        </div>
        {uploadSuccess && (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>Asset registered in portal!</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 px-6 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-[#a35c34] bg-[#fbf5ee]'
              : 'border-[#dfd6cb] bg-[#faf7f2] hover:border-[#b8764a] hover:bg-[#f6f0e7]'
          }`}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0e8de] text-[#8d4e28]">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-[#2b2118]">
            Click to upload or drag files here
          </p>
          <p className="mt-1 text-xs text-[#8c7e74]">
            PNG, JPG, PDF, Figma, PSD, ZIP, DOCX deliverables
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-[#e6ded4] bg-[#faf7f2] p-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2b2118] text-white">
                <FileUp className="h-5 w-5 text-[#d1945f]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#2b2118]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[#7a6e65]">
                  {formatFileSize(selectedFile.size)} • Ready to add
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetSelection}
              disabled={isUploading}
              className="text-xs font-medium text-[#8d4e28] hover:text-[#5a2e15] underline cursor-pointer"
            >
              Change file
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#423730] mb-1">
                Client / Project Workspace
              </label>
              <input
                type="text"
                list="client-suggestions"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Studio, Vogue Q4, Rebrand"
                maxLength={120}
                className="w-full rounded-xl border border-[#dfd6cb] bg-white px-3.5 py-2 text-sm text-[#2b2118] placeholder-[#9e9084] focus:border-[#a35c34] focus:outline-hidden"
              />
              <datalist id="client-suggestions">
                {clientsList.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#423730] mb-1">
                Client Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Final approved vector logo, v2 revisions"
                maxLength={250}
                className="w-full rounded-xl border border-[#dfd6cb] bg-white px-3.5 py-2 text-sm text-[#2b2118] placeholder-[#9e9084] focus:border-[#a35c34] focus:outline-hidden"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetSelection}
              disabled={isUploading}
              className="rounded-xl border border-[#dfd6cb] px-4 py-2 text-xs font-semibold text-[#5a4d43] hover:bg-[#f6f0e7] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center gap-2 rounded-xl bg-[#231710] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#34241b] transition-all cursor-pointer disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#d1945f]" />
                  <span>Saving Asset Record...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 text-[#d1945f]" />
                  <span>Upload Asset</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
