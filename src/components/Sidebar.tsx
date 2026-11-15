import React from 'react';
import {
  Crosshair,
  Plus,
  Search,
  LogOut,
  Trash2,
  X,
  Loader2,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AimConfig, GameId, PlatformMode } from '../types';
import { MOBILE_GAMES, PC_GAMES, getConfigPlatform } from '../utils/aimMath';

interface SidebarProps {
  configs: AimConfig[];
  loadingConfigs: boolean;
  activeConfigId: string | null;
  vaultPlatformFilter: 'All' | PlatformMode;
  onVaultPlatformFilterChange: (p: 'All' | PlatformMode) => void;
  gameFilter: 'All Games' | GameId;
  onGameFilterChange: (game: 'All Games' | GameId) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onNewLoadout: () => void;
  onSelectConfig: (config: AimConfig) => void;
  onDeleteConfig: (config: AimConfig) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  configs,
  loadingConfigs,
  activeConfigId,
  vaultPlatformFilter,
  onVaultPlatformFilterChange,
  gameFilter,
  onGameFilterChange,
  searchQuery,
  onSearchQueryChange,
  onNewLoadout,
  onSelectConfig,
  onDeleteConfig,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, profile, signOutUser } = useAuth();

  const availableGames: ('All Games' | GameId)[] = [
    'All Games',
    ...(vaultPlatformFilter === 'PC'
      ? PC_GAMES.map((g) => g.id)
      : vaultPlatformFilter === 'Mobile'
      ? MOBILE_GAMES.map((g) => g.id)
      : [...PC_GAMES.map((g) => g.id), ...MOBILE_GAMES.map((g) => g.id)]),
  ];

  const filteredConfigs = configs.filter((cfg) => {
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

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 shrink-0 flex-col justify-between border-r border-[#222A3A] bg-[#0F131C] text-slate-100 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#222A3A] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF4655] text-white">
                <Crosshair className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-extrabold tracking-tight text-white">
                AssetSilo
              </span>
            </div>

            <button
              type="button"
              onClick={onCloseMobile}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-[#1A2130] hover:text-white md:hidden cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* + New Loadout Button */}
          <div className="p-4 pb-3 space-y-3">
            <button
              type="button"
              onClick={() => {
                onNewLoadout();
                onCloseMobile();
              }}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#FF4655] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e53947] transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Loadout</span>
            </button>

            {/* Platform Switcher */}
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-[#222A3A] bg-[#0B0E14] p-1">
              {(
                [
                  { id: 'All', label: 'All' },
                  { id: 'PC', label: 'PC FPS', icon: Monitor },
                  { id: 'Mobile', label: 'Mobile', icon: Smartphone },
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
                    className={`rounded-md py-1.5 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
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
          </div>

          {/* Search & Game Filter Tabs */}
          <div className="px-4 pb-3 space-y-2.5 border-b border-[#222A3A]">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Search loadouts or tags..."
                className="w-full rounded-lg border border-[#222A3A] bg-[#0B0E14] pl-8 pr-7 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-hidden"
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

            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto pr-0.5">
              {availableGames.map((game) => {
                const isActive = gameFilter === game;
                const count =
                  game === 'All Games'
                    ? configs.filter(
                        (c) =>
                          vaultPlatformFilter === 'All' ||
                          getConfigPlatform(c) === vaultPlatformFilter
                      ).length
                    : configs.filter((c) => c.game === game).length;

                return (
                  <button
                    key={game}
                    type="button"
                    onClick={() => onGameFilterChange(game)}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer text-left whitespace-nowrap ${
                      isActive
                        ? 'bg-[#1A2130] text-[#00E5FF]'
                        : 'text-slate-400 hover:bg-[#151B27] hover:text-slate-100'
                    }`}
                  >
                    <span>{game}</span>
                    <span className="font-mono text-[11px] tabular-nums text-slate-500">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saved Loadouts Quick List */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
            <div className="flex items-center justify-between px-2 pb-1 text-xs font-semibold text-slate-400">
              <span>Your Loadouts</span>
              <span className="font-mono tabular-nums text-slate-500">
                {filteredConfigs.length}
              </span>
            </div>

            {loadingConfigs ? (
              <div className="flex items-center justify-center py-6 text-xs text-slate-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#00E5FF]" />
                <span>Syncing...</span>
              </div>
            ) : filteredConfigs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#222A3A] bg-[#0B0E14]/50 p-4 text-center">
                <p className="text-xs font-medium text-slate-300">No loadouts yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Save your setup to sync it here
                </p>
              </div>
            ) : (
              filteredConfigs.map((cfg) => {
                const isSelected = activeConfigId === cfg.id;
                const plat = getConfigPlatform(cfg);
                return (
                  <div
                    key={cfg.id}
                    onClick={() => {
                      onSelectConfig(cfg);
                      onCloseMobile();
                    }}
                    className={`group flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#00E5FF]/50 bg-[#1A2130]'
                        : 'border-[#222A3A] bg-[#131822] hover:border-slate-600'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">{cfg.name}</p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                        {plat === 'Mobile'
                          ? `${cfg.game} · ${cfg.cameraSens ?? 85}% Cam · ${cfg.fingerSetup || '4-Finger'}`
                          : `${cfg.game} · ${cfg.dpi ?? 800} DPI · ${cfg.sensitivity ?? 0.35}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConfig(cfg);
                      }}
                      title="Delete loadout"
                      className="rounded p-1 text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-[#FF4655]/15 hover:text-[#FF4655] transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Account & Sign Out */}
        <div className="border-t border-[#222A3A] p-4">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1A2130] border border-[#222A3A] font-display text-xs font-bold text-[#00E5FF]">
                {profile?.displayName
                  ? profile.displayName.charAt(0).toUpperCase()
                  : user?.email?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-white">
                  {profile?.displayName || 'Player'}
                </div>
                <div className="truncate text-[11px] text-slate-400" title={user?.email || ''}>
                  {user?.email}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signOutUser()}
              title="Sign Out"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#222A3A] bg-[#131822] px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-[#FF4655]/60 hover:text-[#FF4655] transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
