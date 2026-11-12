import React, { useState } from 'react';
import { X, Copy, Check, Shield, Globe, Lock, ExternalLink } from 'lucide-react';
import { AssetFile } from '../types';

interface SharePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: AssetFile | null;
  clientName?: string;
}

export const SharePortalModal: React.FC<SharePortalModalProps> = ({
  isOpen,
  onClose,
  file,
  clientName,
}) => {
  const [copied, setCopied] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(true);

  if (!isOpen) return null;

  const targetClient = file?.clientName || clientName || 'General Assets';
  const shareUrl = `${window.location.origin}/#portal?workspace=${encodeURIComponent(
    targetClient
  )}${file ? `&asset=${encodeURIComponent(file.name)}` : ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#e6ded4] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-[#8c7e74] hover:bg-[#f6f0e7] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#faf2e9] text-[#a35c34] border border-[#eeddc9]">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-[#2b2118]">
              {file ? 'Share Asset with Client' : 'Client Portal Link'}
            </h3>
            <p className="text-xs text-[#7a6e65]">
              Generate a secure link for {targetClient}
            </p>
          </div>
        </div>

        <p className="text-xs text-[#695c52] leading-relaxed mb-4">
          Share this link with your client. They can view, review, and download files directly without needing complex software.
        </p>

        {/* Share Link Box */}
        <div className="rounded-xl border border-[#ece4d9] bg-[#faf7f2] p-3.5 mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8c7e74] mb-1.5">
            Portal Access URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-transparent font-mono text-xs text-[#2b2118] focus:outline-hidden select-all"
            />
            <button
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#231710] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#3d291d] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[#d1945f]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Feature Toggles */}
        <div className="space-y-2.5 rounded-xl border border-[#ece4d9] bg-white p-3.5 mb-5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#a35c34]" />
              <span className="font-semibold text-[#2b2118]">
                Client Authentication Required
              </span>
            </div>
            <input
              type="checkbox"
              checked={passwordProtected}
              onChange={(e) => setPasswordProtected(e.target.checked)}
              className="accent-[#a35c34] h-4 w-4 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-[#8c7e74] pl-6">
            Only users signed into this workspace or invited email can access these downloads.
          </p>
        </div>

        <div className="flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#dfd6cb] px-4 py-2 text-xs font-semibold text-[#5a4d43] hover:bg-[#f6f0e7] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
