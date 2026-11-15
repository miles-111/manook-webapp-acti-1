import React, { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Loader2,
  AlertTriangle,
  Trash2,
  X,
  Layers,
  ArrowRightLeft,
  Crosshair,
  Target,
  Menu,
  Save,
  Check,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  AimConfig,
  CrosshairSettings,
  FingerSetup,
  GameId,
  PlatformMode,
} from './types';
import { Sidebar } from './components/Sidebar';
import { PresetMetadataBar } from './components/PresetMetadataBar';
import { SensitivityLab } from './components/SensitivityLab';
import { CrosshairStudio } from './components/CrosshairStudio';
import { AimTestBox } from './components/AimTestBox';
import { SavedLoadoutsGrid } from './components/SavedLoadoutsGrid';
import { AuthView } from './components/AuthView';
import {
  DEFAULT_CROSSHAIR,
  MOBILE_GAMES,
  calculateCm360,
  calculateEDPI,
  generateValorantCode,
  getConfigPlatform,
  isMobileGame,
  isPCGame,
  parseValorantCode,
} from './utils/aimMath';

type MobileTab = 'loadouts' | 'sens' | 'crosshair' | 'warmup';

const GamingHub: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [configs, setConfigs] = useState<AimConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState<boolean>(true);
  const [vaultPlatformFilter, setVaultPlatformFilter] = useState<'All' | PlatformMode>('All');
  const [gameFilter, setGameFilter] = useState<'All Games' | GameId>('All Games');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('loadouts');

  // Active Loadout Studio state
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<PlatformMode>('PC');
  const [name, setName] = useState('Main Tactical Cyan');
  const [game, setGame] = useState<GameId>('Valorant');
  const [tags, setTags] = useState('comp, flick');
  const [notes, setNotes] = useState('');

  // PC FPS state
  const [resolution, setResolution] = useState('1920x1080 (16:9)');
  const [dpi, setDpi] = useState<number>(800);
  const [sensitivity, setSensitivity] = useState<number>(0.35);
  const [crosshair, setCrosshair] = useState<CrosshairSettings>(DEFAULT_CROSSHAIR);

  // Mobile FPS state
  const [cameraSens, setCameraSens] = useState<number>(85);
  const [adsSens, setAdsSens] = useState<number>(105);
  const [gyroSens, setGyroSens] = useState<number>(140);
  const [fingerSetup, setFingerSetup] = useState<FingerSetup>('4-Finger Claw');
  const [hudCode, setHudCode] = useState<string>('7281-9402-1184');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<AimConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      setConfigs([]);
      setLoadingConfigs(false);
      return;
    }

    setLoadingConfigs(true);
    const configsRef = collection(db, 'users', user.uid, 'configs');
    const q = query(configsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: AimConfig[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...(docSnap.data() as Omit<AimConfig, 'id'>) });
        });
        loaded.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setConfigs(loaded);
        setLoadingConfigs(false);
      },
      (error) => {
        setLoadingConfigs(false);
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/configs`);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handlePlatformChange = (nextPlat: PlatformMode) => {
    setPlatform(nextPlat);
    if (nextPlat === 'PC' && !isPCGame(game)) {
      setGame('Valorant');
    } else if (nextPlat === 'Mobile' && !isMobileGame(game)) {
      setGame('CODM');
    }
  };

  const handleMobileGameChange = (nextGame: GameId) => {
    setGame(nextGame);
    if (isMobileGame(nextGame)) {
      const preset = MOBILE_GAMES.find((m) => m.id === nextGame);
      if (preset && !activeConfigId) {
        setCameraSens(preset.defaultCamera);
        setAdsSens(preset.defaultAds);
        setGyroSens(preset.defaultGyro);
      }
    }
  };

  const handleNewLoadout = () => {
    setActiveConfigId(null);
    if (platform === 'Mobile') {
      setName('New Mobile Loadout');
      setGame('CODM');
      setTags('claw, gyro');
      setCameraSens(85);
      setAdsSens(105);
      setGyroSens(140);
      setFingerSetup('4-Finger Claw');
      setHudCode('');
    } else {
      setName('New Loadout');
      setGame('Valorant');
      setTags('main');
      setResolution('1920x1080 (16:9)');
      setDpi(800);
      setSensitivity(0.35);
      setCrosshair(DEFAULT_CROSSHAIR);
    }
    setNotes('');
    setSaveSuccess(false);
  };

  const handleSelectConfig = (cfg: AimConfig) => {
    const plat = getConfigPlatform(cfg);
    setActiveConfigId(cfg.id);
    setPlatform(plat);
    setName(cfg.name);
    setGame(cfg.game);
    setTags(cfg.tags || '');
    setNotes(cfg.notes || '');

    if (plat === 'Mobile') {
      setCameraSens(cfg.cameraSens ?? 85);
      setAdsSens(cfg.adsSens ?? 105);
      setGyroSens(cfg.gyroSens ?? 140);
      setFingerSetup(cfg.fingerSetup || '4-Finger Claw');
      setHudCode(cfg.hudCode || '');
    } else {
      setResolution(cfg.resolution || '1920x1080 (16:9)');
      setDpi(cfg.dpi ?? 800);
      setSensitivity(cfg.sensitivity ?? 0.35);
      const parsedCrosshair = cfg.crosshairCode ? parseValorantCode(cfg.crosshairCode) : null;
      setCrosshair(parsedCrosshair || DEFAULT_CROSSHAIR);
    }
    setSaveSuccess(false);
  };

  const handleSavePreset = async (asNew = false) => {
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess(false);

    const nowIso = new Date().toISOString();
    const safeName = (name.trim() || 'Untitled Loadout').slice(0, 100);
    const safeTags = tags.trim().slice(0, 160);
    const safeNotes = notes.trim().slice(0, 1000);

    const basePayload =
      platform === 'PC'
        ? {
            name: asNew && !activeConfigId ? safeName : safeName,
            platform: 'PC' as PlatformMode,
            game: isPCGame(game) ? game : ('Valorant' as GameId),
            tags: safeTags,
            dpi: Math.max(50, Math.min(32000, Number(dpi) || 800)),
            sensitivity: Math.max(0.001, Math.min(100, Number(sensitivity) || 0.35)),
            edpi: calculateEDPI(
              Math.max(50, Math.min(32000, Number(dpi) || 800)),
              Math.max(0.001, Math.min(100, Number(sensitivity) || 0.35))
            ),
            cm360: calculateCm360(
              Math.max(50, Math.min(32000, Number(dpi) || 800)),
              Math.max(0.001, Math.min(100, Number(sensitivity) || 0.35)),
              isPCGame(game) ? game : 'Valorant'
            ),
            crosshairCode: generateValorantCode(crosshair).slice(0, 255),
            resolution: (resolution.trim() || '1920x1080 (16:9)').slice(0, 40),
            notes: safeNotes,
            updatedAt: nowIso,
          }
        : {
            name: safeName,
            platform: 'Mobile' as PlatformMode,
            game: isMobileGame(game) ? game : ('CODM' as GameId),
            tags: safeTags,
            cameraSens: Math.max(1, Math.min(400, Number(cameraSens) || 85)),
            adsSens: Math.max(1, Math.min(400, Number(adsSens) || 105)),
            gyroSens: Math.max(0, Math.min(500, Number(gyroSens) || 140)),
            fingerSetup,
            hudCode: hudCode.trim().slice(0, 255),
            notes: safeNotes,
            updatedAt: nowIso,
          };

    try {
      if (activeConfigId && !asNew) {
        const docPath = `users/${user.uid}/configs/${activeConfigId}`;
        try {
          await updateDoc(doc(db, 'users', user.uid, 'configs', activeConfigId), basePayload);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, docPath);
        }
      } else {
        const newDocRef = doc(collection(db, 'users', user.uid, 'configs'));
        const docPath = `users/${user.uid}/configs/${newDocRef.id}`;
        const finalName = asNew ? `${safeName} (Copy)`.slice(0, 100) : safeName;
        const newDoc = {
          ...basePayload,
          name: finalName,
          userId: user.uid,
          createdAt: nowIso,
        };
        try {
          await setDoc(newDocRef, newDoc);
          setActiveConfigId(newDocRef.id);
          if (asNew) setName(finalName);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, docPath);
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!configToDelete || !user) return;
    setIsDeleting(true);
    const docPath = `users/${user.uid}/configs/${configToDelete.id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'configs', configToDelete.id));
      if (activeConfigId === configToDelete.id) {
        setActiveConfigId(null);
      }
      setConfigToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center tactical-grid-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
          <p className="font-display text-sm font-semibold text-slate-200">
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
    <div className="flex min-h-screen w-full tactical-grid-bg text-slate-100">
      <Sidebar
        configs={configs}
        loadingConfigs={loadingConfigs}
        activeConfigId={activeConfigId}
        vaultPlatformFilter={vaultPlatformFilter}
        onVaultPlatformFilterChange={setVaultPlatformFilter}
        gameFilter={gameFilter}
        onGameFilterChange={setGameFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onNewLoadout={handleNewLoadout}
        onSelectConfig={handleSelectConfig}
        onDeleteConfig={(cfg) => setConfigToDelete(cfg)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <main className="flex-1 overflow-y-auto px-4 pt-5 pb-24 sm:px-8 sm:py-8 md:px-10 md:pb-10">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Compact Mobile Header when not on Loadouts tab */}
          {mobileTab !== 'loadouts' && (
            <div className="flex items-center justify-between gap-3 md:hidden">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#222A3A] bg-[#131822] text-white cursor-pointer"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <div className="font-display text-lg font-extrabold text-white truncate">
                    AssetSilo
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {name} · {game}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSavePreset(false)}
                className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg bg-[#FF4655] px-3.5 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
              >
                {saveSuccess ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                <span>{saveSuccess ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          )}

          {/* Loadout Studio Editor (always visible on desktop, active on 'loadouts' tab on mobile) */}
          <div className={mobileTab === 'loadouts' ? 'block' : 'hidden md:block'}>
            <PresetMetadataBar
              activeConfigId={activeConfigId}
              platform={platform}
              onPlatformChange={handlePlatformChange}
              name={name}
              onNameChange={setName}
              game={game}
              onGameChange={(g) =>
                platform === 'Mobile' ? handleMobileGameChange(g) : setGame(g)
              }
              tags={tags}
              onTagsChange={setTags}
              resolution={resolution}
              onResolutionChange={setResolution}
              dpi={dpi}
              sensitivity={sensitivity}
              cameraSens={cameraSens}
              onCameraSensChange={setCameraSens}
              adsSens={adsSens}
              onAdsSensChange={setAdsSens}
              gyroSens={gyroSens}
              onGyroSensChange={setGyroSens}
              fingerSetup={fingerSetup}
              onFingerSetupChange={setFingerSetup}
              hudCode={hudCode}
              onHudCodeChange={setHudCode}
              notes={notes}
              onNotesChange={setNotes}
              isSaving={isSaving}
              saveSuccess={saveSuccess}
              onSavePreset={handleSavePreset}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            />
          </div>

          {/* 1. Interactive Sens Lab */}
          <div className={mobileTab === 'sens' ? 'block' : 'hidden md:block'}>
            <SensitivityLab
              platform={platform}
              dpi={dpi}
              sensitivity={sensitivity}
              game={game}
              onApplyPcCalibration={(nextDpi, nextSens, nextGame) => {
                setPlatform('PC');
                setDpi(nextDpi);
                setSensitivity(nextSens);
                setGame(nextGame);
              }}
              cameraSens={cameraSens}
              adsSens={adsSens}
              gyroSens={gyroSens}
              onApplyMobileCalibration={(nextCam, nextAds, nextGyro, nextGame) => {
                setPlatform('Mobile');
                setCameraSens(nextCam);
                setAdsSens(nextAds);
                setGyroSens(nextGyro);
                setGame(nextGame);
              }}
            />
          </div>

          {/* 2. Touch-Friendly Crosshair Studio */}
          <div className={mobileTab === 'crosshair' ? 'block' : 'hidden md:block'}>
            <CrosshairStudio settings={crosshair} onChange={setCrosshair} />
          </div>

          {/* 3. Aim & Reflex Warmup (3 Modes) */}
          <div className={mobileTab === 'warmup' ? 'block' : 'hidden md:block'}>
            <AimTestBox
              platform={platform}
              dpi={dpi}
              sensitivity={sensitivity}
              cameraSens={cameraSens}
              game={game}
              crosshair={crosshair}
            />
          </div>

          {/* 4. PC & Mobile Loadout Vault */}
          <div className={mobileTab === 'loadouts' ? 'block' : 'hidden md:block'}>
            <SavedLoadoutsGrid
              configs={configs}
              activeConfigId={activeConfigId}
              vaultPlatformFilter={vaultPlatformFilter}
              onVaultPlatformFilterChange={setVaultPlatformFilter}
              gameFilter={gameFilter}
              onGameFilterChange={setGameFilter}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSelectConfig={handleSelectConfig}
              onDeleteConfig={(cfg) => setConfigToDelete(cfg)}
            />
          </div>
        </div>
      </main>

      {/* Fixed Bottom Navigation Bar for Mobile (< 768px) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-4 border-t border-[#222A3A] bg-[#0F131C]/95 backdrop-blur-md md:hidden"
      >
        {(
          [
            { id: 'loadouts', label: 'Loadouts', icon: Layers },
            { id: 'sens', label: 'Sens Lab', icon: ArrowRightLeft },
            { id: 'crosshair', label: 'Crosshair', icon: Crosshair },
            { id: 'warmup', label: 'Warmup', icon: Target },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMobileTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                active ? 'text-[#00E5FF]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-[#00E5FF]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Delete Loadout Confirmation Modal */}
      {configToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-[#222A3A] bg-[#131822] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setConfigToDelete(null)}
              disabled={isDeleting}
              className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-[#1A2130] hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF4655]/15 text-[#FF4655] border border-[#FF4655]/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Delete saved loadout?
                </h3>
                <p className="text-xs text-slate-400">This cannot be undone</p>
              </div>
            </div>

            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] p-3.5 mb-5 text-xs">
              <p className="font-semibold text-white truncate">{configToDelete.name}</p>
              <p className="text-slate-400 mt-0.5 font-mono">
                {getConfigPlatform(configToDelete) === 'Mobile'
                  ? `${configToDelete.game} · ${configToDelete.cameraSens ?? 85}% Cam · ${configToDelete.fingerSetup || '4-Finger Claw'}`
                  : `${configToDelete.game} · ${configToDelete.dpi ?? 800} DPI · ${configToDelete.sensitivity ?? 0.35} sens`}
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfigToDelete(null)}
                disabled={isDeleting}
                className="min-h-[42px] rounded-lg border border-[#222A3A] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#1A2130] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex min-h-[42px] items-center gap-1.5 rounded-lg bg-[#FF4655] px-4 py-2 text-xs font-bold text-white hover:bg-[#e53947] cursor-pointer disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Loadout'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <GamingHub />
    </AuthProvider>
  );
}
