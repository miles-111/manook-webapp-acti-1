import React, { useState } from 'react';
import {
  Copy,
  Check,
  MessageSquare,
  Trash2,
  Layers,
  Search,
  X,
} from 'lucide-react';
import { AimConfig, GameId, PlatformMode } from '../types';
import {
  MOBILE_GAMES,
  PC_GAMES,
  formatDiscordLoadout,
  formatRelativeDate,
  getConfigPlatform,
} from '../utils/aimMath';

interface SavedLoadoutsGridProps {
  configs: AimConfig[];
  activeConfigId: string | null;
  vaultPlatformFilter: 'All' | PlatformMode;
  onVaultPlatformFilterChange: (p: 'All' | PlatformMode) => void;
  gameFilter: 'All Games' | GameId;
  onGameFilterChange: (g: 'All Games' | GameId) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSelectConfig: (config: AimConfig) => void;
  onDeleteConfig: (config: AimConfig) => void;
}

export const SavedLoadoutsGrid: React.FC<SavedLoadoutsGridProps> = ({
  configs,
  activeConfigId,
  vaultPlatformFilter,
  onVaultPlatformFilterChange,
  gameFilter,
  onGameFilterChange,
  searchQuery,
  onSearchQueryChange,
  onSelectConfig,
  onDeleteConfig,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [discordCopiedId, setDiscordCopiedId] = useState<string | null>(null);

  const gameTabs: ('All Games' | GameId)[] = [
    'All Games',
    ...(vaultPlatformFilter === 'PC'
      ? PC_GAMES.map((g) => g.id)
      : vaultPlatformFilter === 'Mobile'
      ? MOBILE_GAMES.map((g) => g.id)
      : [...PC_GAMES.map((g) => g.id), ...MOBILE_GAMES.map((g) => g.id)]),
  ];

  const filtered = configs.filter((cfg) => {
    const plat = getConfigPlatform(cfg);
    const matchesPlat = vaultPlatformFilter === 'All' || plat === vaultPlatformFilter;
    const matchesGame = gameFilter === 'All Games' || cfg.game === gameFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      cfg.name.toLowerCase().includes(q) ||
      (cfg.tags && cfg.tags.toLowerCase().includes(q)) ||
      cfg.game.toLowerCase().includes(q);
    return matchesPlat && matchesGame && matchesSearch;
  });

  const handleCopyCode = (cfg: AimConfig) => {
    const plat = getConfigPlatform(cfg);
    const text = plat === 'Mobile' ? cfg.hudCode || '' : cfg.crosshairCode || '';
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(cfg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyDiscord = (cfg: AimConfig) => {
    navigator.clipboard.writeText(formatDiscordLoadout(cfg));
    setDiscordCopiedId(cfg.id);
    setTimeout(() => setDiscordCopiedId(null), 2000);
  };

  return (
    <section className="rounded-xl border border-[#222A3A] bg-[#131822] p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-4 border-b border-[#222A3A] pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B0E14] border border-[#222A3A] text-[#FF4655]">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                PC &amp; Mobile Loadout Vault ({filtered.length})
              </h2>
              <p className="text-xs text-slate-400">
                Tap any card to load it, copy codes in 1 click, or share straight to Discord
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search name, game, or tag..."
              className="w-full min-h-[40px] rounded-lg border border-[#222A3A] bg-[#0B0E14] pl-8 pr-7 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Platform Switcher + Game Filter Tabs */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="grid grid-cols-3 rounded-lg border border-[#222A3A] bg-[#0B0E14] p-1 shrink-0">
            {(
              [
                { id: 'All', label: 'All' },
                { id: 'PC', label: 'PC FPS' },
                { id: 'Mobile', label: 'Mobile FPS' },
              ] as const
            ).map((tab) => {
              const active = vaultPlatformFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onVaultPlatformFilterChange(tab.id);
                    onGameFilterChange('All Games');
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap min-h-[36px] ${
                    active
                      ? 'bg-[#1A2130] text-[#00E5FF]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {gameTabs.map((g) => {
              const active = gameFilter === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => onGameFilterChange(g)}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap min-h-[36px] ${
                    active
                      ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]'
                      : 'border-[#222A3A] bg-[#0B0E14] text-slate-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#222A3A] bg-[#0B0E14] py-12 px-6 text-center">
          <p className="text-sm font-semibold text-white">
            {configs.length === 0
              ? 'No saved loadouts yet'
              : 'No loadouts match your current filter'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Dial in your PC or Mobile setup above, then hit Save Loadout to keep it synced.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((cfg) => {
            const isActive = activeConfigId === cfg.id;
            const isCodeCopied = copiedId === cfg.id;
            const isDiscordCopied = discordCopiedId === cfg.id;
            const plat = getConfigPlatform(cfg);
            const codeValue = plat === 'Mobile' ? cfg.hudCode : cfg.crosshairCode;

            return (
              <article
                key={cfg.id}
                onClick={() => onSelectConfig(cfg)}
                className={`rounded-xl border p-4 sm:p-5 transition-colors cursor-pointer space-y-4 ${
                  isActive
                    ? 'border-[#00E5FF] bg-[#161D2B]'
                    : 'border-[#222A3A] bg-[#0B0E14] hover:border-slate-600'
                }`}
              >
                {/* Title & Quiet Metadata */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-[#00E5FF]">{cfg.game}</span>
                      <span aria-hidden="true">·</span>
                      <span>{plat} FPS</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {plat === 'Mobile'
                          ? cfg.fingerSetup || '4-Finger Claw'
                          : cfg.resolution || '1920x1080 (16:9)'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{formatRelativeDate(cfg.updatedAt)}</span>
                    </div>
                    <h3 className="mt-1 truncate font-display text-base font-bold text-white">
                      {cfg.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConfig(cfg);
                    }}
                    title="Delete loadout"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-[#FF4655]/15 hover:text-[#FF4655] transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Metrics Row */}
                {plat === 'PC' ? (
                  <div className="grid grid-cols-4 gap-2 border-y border-[#222A3A] py-3">
                    <div>
                      <div className="text-[11px] text-slate-400">DPI</div>
                      <div className="font-mono text-sm font-bold tabular-nums text-white">
                        {cfg.dpi ?? 800}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Sens</div>
                      <div className="font-mono text-sm font-bold tabular-nums text-white">
                        {cfg.sensitivity ?? 0.35}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">eDPI</div>
                      <div className="font-mono text-sm font-bold tabular-nums text-[#00E5FF]">
                        {cfg.edpi ?? 280}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">360°</div>
                      <div className="font-mono text-sm font-bold tabular-nums text-[#FF4655]">
                        {cfg.cm360 ?? 46.7} cm
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 border-y border-[#222A3A] py-3">
                    <div>
                      <div className="text-[11px] text-slate-400">Camera</div>
                      <div className="font-mono text-sm font-bold tabular-nums text-white">
                        {cfg.cameraSens ?? 85}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">ADS</div>
                      <div className="font-mono text-sm font-bold tabular-nums text-[#00E5FF]">
                        {cfg.adsSens ?? 105}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Gyro</div>
                      <div className="font-mono text-sm font-bold tabular-nums text-[#FF4655]">
                        {cfg.gyroSens ?? 140}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Setup</div>
                      <div className="truncate text-xs font-bold text-slate-200 mt-0.5">
                        {(cfg.fingerSetup || '4-Finger').replace(' Claw', '')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Share / Crosshair Code */}
                <div className="flex items-center justify-between gap-2 rounded-lg border border-[#222A3A] bg-[#131822] px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500">
                      {plat === 'Mobile' ? 'HUD Share Code' : 'Crosshair Code'}
                    </div>
                    <code className="block truncate font-mono text-xs text-slate-300">
                      {codeValue || 'No code saved'}
                    </code>
                  </div>
                  <button
                    type="button"
                    disabled={!codeValue}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCode(cfg);
                    }}
                    className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold text-[#00E5FF] hover:bg-[#1A2130] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {isCodeCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="truncate text-xs text-slate-500">
                    {cfg.tags || cfg.notes || 'Ready to load'}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyDiscord(cfg);
                    }}
                    className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border border-[#222A3A] bg-[#131822] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-[#00E5FF] hover:text-white transition-colors cursor-pointer"
                  >
                    {isDiscordCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#00E5FF]" />
                        <span>Copied for Discord!</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-3.5 w-3.5 text-[#00E5FF]" />
                        <span>Copy for Discord</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
