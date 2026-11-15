import React, { useState } from 'react';
import {
  Save,
  Check,
  Loader2,
  Menu,
  PlusCircle,
  Monitor,
  Smartphone,
  Copy,
} from 'lucide-react';
import { FingerSetup, GameId, MobileGameId, PCGameId, PlatformMode } from '../types';
import {
  FINGER_SETUPS,
  MOBILE_GAMES,
  PC_GAMES,
  RESOLUTIONS,
  calculateCm360,
  calculateEDPI,
} from '../utils/aimMath';

interface PresetMetadataBarProps {
  activeConfigId: string | null;
  platform: PlatformMode;
  onPlatformChange: (p: PlatformMode) => void;
  name: string;
  onNameChange: (v: string) => void;
  game: GameId;
  onGameChange: (g: GameId) => void;
  tags: string;
  onTagsChange: (v: string) => void;
  // PC fields
  resolution: string;
  onResolutionChange: (v: string) => void;
  dpi: number;
  sensitivity: number;
  // Mobile fields
  cameraSens: number;
  onCameraSensChange: (v: number) => void;
  adsSens: number;
  onAdsSensChange: (v: number) => void;
  gyroSens: number;
  onGyroSensChange: (v: number) => void;
  fingerSetup: FingerSetup;
  onFingerSetupChange: (v: FingerSetup) => void;
  hudCode: string;
  onHudCodeChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  isSaving: boolean;
  saveSuccess: boolean;
  onSavePreset: (asNew?: boolean) => void;
  onOpenMobileMenu: () => void;
}

export const PresetMetadataBar: React.FC<PresetMetadataBarProps> = ({
  activeConfigId,
  platform,
  onPlatformChange,
  name,
  onNameChange,
  game,
  onGameChange,
  tags,
  onTagsChange,
  resolution,
  onResolutionChange,
  dpi,
  sensitivity,
  cameraSens,
  onCameraSensChange,
  adsSens,
  onAdsSensChange,
  gyroSens,
  onGyroSensChange,
  fingerSetup,
  onFingerSetupChange,
  hudCode,
  onHudCodeChange,
  notes,
  onNotesChange,
  isSaving,
  saveSuccess,
  onSavePreset,
  onOpenMobileMenu,
}) => {
  const [copiedHud, setCopiedHud] = useState(false);

  const edpi = calculateEDPI(dpi, sensitivity);
  const cm360 = calculateCm360(dpi, sensitivity, game);

  const handleCopyHud = () => {
    if (!hudCode.trim()) return;
    navigator.clipboard.writeText(hudCode.trim());
    setCopiedHud(true);
    setTimeout(() => setCopiedHud(false), 1800);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#222A3A] bg-[#131822] text-white md:hidden cursor-pointer"
            title="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Loadout Studio
            </h1>
            {platform === 'PC' ? (
              <p className="text-xs text-slate-400 truncate">
                {game} · <span className="font-mono text-slate-200">{dpi} DPI</span> ·{' '}
                <span className="font-mono text-[#00E5FF]">{edpi} eDPI</span> ·{' '}
                <span className="font-mono text-[#FF4655]">{cm360} cm/360°</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 truncate">
                {game} · <span className="font-mono text-[#00E5FF]">{cameraSens}% Cam</span> ·{' '}
                <span className="font-mono text-slate-200">{adsSens}% ADS</span> ·{' '}
                <span className="font-mono text-[#FF4655]">{gyroSens}% Gyro</span> · {fingerSetup}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* [ PC FPS | Mobile FPS ] Switcher */}
          <div className="grid grid-cols-2 rounded-lg border border-[#222A3A] bg-[#131822] p-1">
            <button
              type="button"
              onClick={() => onPlatformChange('PC')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap min-h-[36px] ${
                platform === 'PC'
                  ? 'bg-[#00E5FF] text-[#0B0E14]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>PC FPS</span>
            </button>
            <button
              type="button"
              onClick={() => onPlatformChange('Mobile')}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap min-h-[36px] ${
                platform === 'Mobile'
                  ? 'bg-[#00E5FF] text-[#0B0E14]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile FPS</span>
            </button>
          </div>

          {activeConfigId && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onSavePreset(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#222A3A] bg-[#131822] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <PlusCircle className="h-3.5 w-3.5 text-[#00E5FF]" />
              <span>Save as Copy</span>
            </button>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={() => onSavePreset(false)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#FF4655] px-4 py-2 text-xs font-bold text-white hover:bg-[#e53947] transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Loadout Saved</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>{activeConfigId ? 'Update Loadout' : 'Save Loadout'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loadout Metadata Form */}
      <div className="rounded-xl border border-[#222A3A] bg-[#131822] p-4 sm:p-5 space-y-3.5">
        {platform === 'PC' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Loadout Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                maxLength={100}
                placeholder="e.g. Main Radiant Cyan"
                className="w-full min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                PC Game
              </label>
              <select
                value={game}
                onChange={(e) => onGameChange(e.target.value as PCGameId)}
                className="w-full min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 text-xs font-semibold text-white focus:border-[#00E5FF] focus:outline-hidden cursor-pointer"
              >
                {PC_GAMES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Resolution
              </label>
              <select
                value={resolution}
                onChange={(e) => onResolutionChange(e.target.value)}
                className="w-full min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 text-xs font-semibold text-white focus:border-[#00E5FF] focus:outline-hidden cursor-pointer"
              >
                {RESOLUTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => onTagsChange(e.target.value)}
                maxLength={160}
                placeholder="e.g. comp, stretched, main"
                className="w-full min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-hidden"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Loadout Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. CODM 4-Finger Rush"
                  className="w-full min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Mobile Game
                </label>
                <select
                  value={game}
                  onChange={(e) => onGameChange(e.target.value as MobileGameId)}
                  className="w-full min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 text-xs font-semibold text-white focus:border-[#00E5FF] focus:outline-hidden cursor-pointer"
                >
                  {MOBILE_GAMES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Finger Setup
                </label>
                <select
                  value={fingerSetup}
                  onChange={(e) => onFingerSetupChange(e.target.value as FingerSetup)}
                  className="w-full min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 text-xs font-semibold text-white focus:border-[#00E5FF] focus:outline-hidden cursor-pointer"
                >
                  {FINGER_SETUPS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => onTagsChange(e.target.value)}
                  maxLength={160}
                  placeholder="e.g. gyro, claw, ranked"
                  className="w-full min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Camera Sens (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={400}
                  value={cameraSens}
                  onChange={(e) =>
                    onCameraSensChange(Math.max(1, Math.min(400, Number(e.target.value) || 1)))
                  }
                  className="w-full min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 font-mono text-xs font-bold text-white focus:border-[#00E5FF] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  ADS / Scope (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={400}
                  value={adsSens}
                  onChange={(e) =>
                    onAdsSensChange(Math.max(1, Math.min(400, Number(e.target.value) || 1)))
                  }
                  className="w-full min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 font-mono text-xs font-bold text-white focus:border-[#00E5FF] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Gyroscope (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={gyroSens}
                  onChange={(e) =>
                    onGyroSensChange(Math.max(0, Math.min(500, Number(e.target.value) || 0)))
                  }
                  className="w-full min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 font-mono text-xs font-bold text-white focus:border-[#00E5FF] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3 lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  HUD Share Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hudCode}
                    onChange={(e) => onHudCodeChange(e.target.value)}
                    maxLength={255}
                    placeholder="Paste HUD code (e.g. 7281-9402-1184)..."
                    className="flex-1 min-w-0 min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 font-mono text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCopyHud}
                    className="inline-flex min-h-[42px] shrink-0 items-center gap-1.5 rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 text-xs font-semibold text-[#00E5FF] hover:border-[#00E5FF] transition-colors cursor-pointer"
                  >
                    {copiedHud ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedHud ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <input
          type="text"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          maxLength={1000}
          placeholder={
            platform === 'PC'
              ? 'Notes (mousepad, grip, raw input, graphics tweaks...)'
              : 'Notes (device model, FPS cap, FOV, finger sleeves, trigger bindings...)'
          }
          className="w-full min-h-[42px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-[#00E5FF] focus:outline-hidden"
        />
      </div>
    </div>
  );
};
