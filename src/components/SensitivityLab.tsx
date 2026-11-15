import React, { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  Check,
  Copy,
  HelpCircle,
  Monitor,
  Ruler,
  Smartphone,
} from 'lucide-react';
import { GameId, MobileGameId, PCGameId, PlatformMode } from '../types';
import {
  MOBILE_GAMES,
  PC_GAMES,
  calculateCm360,
  calculateEDPI,
  convertMobileSensitivity,
  convertSensitivity,
  isMobileGame,
  isPCGame,
} from '../utils/aimMath';

interface SensitivityLabProps {
  platform: PlatformMode;
  dpi: number;
  sensitivity: number;
  game: GameId;
  onApplyPcCalibration: (nextDpi: number, nextSens: number, nextGame: PCGameId) => void;
  cameraSens: number;
  adsSens: number;
  gyroSens: number;
  onApplyMobileCalibration: (
    nextCamera: number,
    nextAds: number,
    nextGyro: number,
    nextGame: MobileGameId
  ) => void;
}

export const SensitivityLab: React.FC<SensitivityLabProps> = ({
  platform,
  dpi,
  sensitivity,
  game,
  onApplyPcCalibration,
  cameraSens,
  adsSens,
  gyroSens,
  onApplyMobileCalibration,
}) => {
  const [labMode, setLabMode] = useState<PlatformMode>(platform);
  const [targetPcGame, setTargetPcGame] = useState<PCGameId>(
    game === 'Valorant' ? 'CS2' : 'Valorant'
  );
  const [showTooltip, setShowTooltip] = useState(false);

  // Mobile Sens Calculator state
  const activeMobileSource: MobileGameId = isMobileGame(game) ? game : 'CODM';
  const [mobileSourceGame, setMobileSourceGame] = useState<MobileGameId>(activeMobileSource);
  const [mobileTargetGame, setMobileTargetGame] = useState<MobileGameId>(
    activeMobileSource === 'CODM' ? 'PUBGM' : 'CODM'
  );
  const [mobileFineTune, setMobileFineTune] = useState<number>(1);
  const [copiedMobile, setCopiedMobile] = useState(false);

  useEffect(() => {
    setLabMode(platform);
    if (isMobileGame(game)) {
      setMobileSourceGame(game);
    }
  }, [platform, game]);

  const activePcGame: PCGameId = isPCGame(game) ? game : 'Valorant';
  const currentEdpi = calculateEDPI(dpi, sensitivity);
  const currentCm360 = calculateCm360(dpi, sensitivity, activePcGame);
  const convertedPcSens = convertSensitivity(sensitivity, activePcGame, targetPcGame);
  const convertedPcEdpi = calculateEDPI(dpi, convertedPcSens);

  const padWidthCm = 45;
  const swipePct = currentCm360 > 0 ? Math.min(100, (currentCm360 / padWidthCm) * 100) : 0;
  const halfTurnCm = Math.round((currentCm360 / 2) * 10) / 10;
  const halfTurnPct = currentCm360 > 0 ? Math.min(100, (halfTurnCm / padWidthCm) * 100) : 0;

  const convertedMobile = convertMobileSensitivity(
    cameraSens,
    adsSens,
    gyroSens,
    mobileSourceGame,
    mobileTargetGame,
    mobileFineTune
  );

  const handleCopyMobileSummary = () => {
    const text = `${mobileTargetGame} Converted Sens — Camera: ${convertedMobile.cameraSens}% | ADS: ${convertedMobile.adsSens}% | Gyro: ${convertedMobile.gyroSens}%`;
    navigator.clipboard.writeText(text);
    setCopiedMobile(true);
    setTimeout(() => setCopiedMobile(false), 1800);
  };

  return (
    <section className="rounded-xl border border-[#222A3A] bg-[#131822] p-4 sm:p-6 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#222A3A] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B0E14] border border-[#222A3A] text-[#00E5FF]">
            <ArrowRightLeft className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white">Sens Lab</h2>
            <p className="text-xs text-slate-400">
              {labMode === 'PC'
                ? 'Convert PC sensitivity & check your physical 360° desk swipe'
                : 'Scale Camera, ADS & Gyroscope percentages between mobile FPS games'}
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 rounded-lg border border-[#222A3A] bg-[#0B0E14] p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setLabMode('PC')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap min-h-[38px] ${
              labMode === 'PC'
                ? 'bg-[#1A2130] text-[#00E5FF]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>PC Sens Converter</span>
          </button>
          <button
            type="button"
            onClick={() => setLabMode('Mobile')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap min-h-[38px] ${
              labMode === 'Mobile'
                ? 'bg-[#1A2130] text-[#00E5FF]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobile Sens Calculator</span>
          </button>
        </div>
      </div>

      {labMode === 'PC' ? (
        <>
          {/* PC Inputs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Current Game
              </label>
              <select
                value={activePcGame}
                onChange={(e) =>
                  onApplyPcCalibration(dpi, sensitivity, e.target.value as PCGameId)
                }
                className="w-full min-h-[44px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 text-sm text-white focus:border-[#00E5FF] focus:outline-hidden cursor-pointer"
              >
                {PC_GAMES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mouse DPI
              </label>
              <input
                type="number"
                min={50}
                max={32000}
                step={50}
                value={dpi}
                onChange={(e) => {
                  const val = Math.max(50, Math.min(32000, Number(e.target.value) || 800));
                  onApplyPcCalibration(val, sensitivity, activePcGame);
                }}
                className="w-full min-h-[44px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#00E5FF] focus:outline-hidden"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[400, 800, 1600, 3200].map((presetDpi) => (
                  <button
                    key={presetDpi}
                    type="button"
                    onClick={() => onApplyPcCalibration(presetDpi, sensitivity, activePcGame)}
                    className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors cursor-pointer ${
                      dpi === presetDpi
                        ? 'bg-[#00E5FF] text-[#0B0E14] font-bold'
                        : 'bg-[#0B0E14] border border-[#222A3A] text-slate-400 hover:text-white'
                    }`}
                  >
                    {presetDpi}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                In-Game Sens
              </label>
              <input
                type="number"
                min={0.001}
                max={100}
                step={0.01}
                value={sensitivity}
                onChange={(e) => {
                  const val = Math.max(0.001, Math.min(100, Number(e.target.value) || 0.01));
                  onApplyPcCalibration(dpi, val, activePcGame);
                }}
                className="w-full min-h-[44px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#00E5FF] focus:outline-hidden"
              />
              <p className="mt-1.5 text-[11px] text-slate-400">
                Scales Pointer Lock look speed in Warmup
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Switching To
              </label>
              <select
                value={targetPcGame}
                onChange={(e) => setTargetPcGame(e.target.value as PCGameId)}
                className="w-full min-h-[44px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 text-sm text-white focus:border-[#00E5FF] focus:outline-hidden cursor-pointer"
              >
                {PC_GAMES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PC Results Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#222A3A] pt-5">
            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Your {targetPcGame} Sens</span>
                  <button
                    type="button"
                    onClick={() => onApplyPcCalibration(dpi, convertedPcSens, targetPcGame)}
                    className="text-xs font-semibold text-[#00E5FF] hover:underline cursor-pointer"
                  >
                    Use this game
                  </button>
                </div>
                <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-white">
                  {convertedPcSens}
                </div>
              </div>
              <p className="mt-1 font-mono text-[11px] text-slate-400">
                {convertedPcEdpi} eDPI in {targetPcGame}
              </p>
            </div>

            <div className="relative rounded-lg border border-[#222A3A] bg-[#0B0E14] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Your eDPI ({activePcGame})</span>
                <button
                  type="button"
                  onClick={() => setShowTooltip((prev) => !prev)}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#00E5FF] cursor-pointer"
                  aria-label="What is eDPI?"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>What&apos;s this?</span>
                </button>
              </div>
              <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#00E5FF]">
                {currentEdpi}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                DPI × Sens = your true aim speed
              </p>

              {showTooltip && (
                <div className="absolute right-3 top-10 z-20 w-56 rounded-lg border border-[#00E5FF]/40 bg-[#131822] p-2.5 text-xs text-slate-200 shadow-lg">
                  DPI × Sens = your true aim speed. Compare this number with pro players using any
                  mouse DPI.
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] p-4">
              <span className="text-xs text-slate-400">Full 360° Desk Swipe</span>
              <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#FF4655]">
                {currentCm360} cm
              </div>
              <p className="mt-1 font-mono text-[11px] text-slate-400">
                180° flick: {halfTurnCm} cm · {(currentCm360 / 2.54).toFixed(1)} in
              </p>
            </div>
          </div>

          {/* Visual 45cm Mousepad Bar */}
          <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 font-semibold text-slate-200">
                <Ruler className="h-4 w-4 text-[#FF4655]" />
                Desk Mousepad Guide (45 cm wide pad)
              </span>
              <span className="text-slate-400">
                {currentCm360 <= padWidthCm
                  ? `A full 360° spin uses ${Math.round(swipePct)}% of a standard 45 cm pad`
                  : `Takes slightly more than 1 full pad swipe (+${(currentCm360 - padWidthCm).toFixed(1)} cm)`}
              </span>
            </div>

            <div className="relative h-10 w-full rounded-lg border border-[#222A3A] bg-[#131822] overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-linear-to-r from-[#FF4655] to-[#00E5FF] transition-all duration-300 flex items-center justify-end pr-2.5"
                style={{ width: `${swipePct}%` }}
              >
                {swipePct > 22 && (
                  <span className="font-mono text-[11px] font-bold text-[#0B0E14]">
                    360° · {currentCm360} cm
                  </span>
                )}
              </div>

              {halfTurnPct > 0 && halfTurnPct < 96 && (
                <div
                  className="absolute inset-y-0 w-0.5 bg-white/80 z-10"
                  style={{ left: `${halfTurnPct}%` }}
                >
                  <span className="absolute top-1.5 left-1.5 rounded bg-[#0B0E14]/90 px-1.5 py-0.5 font-mono text-[10px] text-white whitespace-nowrap">
                    180° ({halfTurnCm} cm)
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between font-mono text-[11px] text-slate-500">
              <span>0 cm</span>
              <span>15 cm</span>
              <span>30 cm</span>
              <span>45 cm</span>
            </div>
          </div>
        </>
      ) : (
        /* Mobile Sens Calculator */
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Current Mobile Game
              </label>
              <select
                value={mobileSourceGame}
                onChange={(e) => {
                  const next = e.target.value as MobileGameId;
                  setMobileSourceGame(next);
                  onApplyMobileCalibration(cameraSens, adsSens, gyroSens, next);
                }}
                className="w-full min-h-[44px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 text-sm text-white focus:border-[#00E5FF] focus:outline-hidden cursor-pointer"
              >
                {MOBILE_GAMES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Camera Sens (%)
              </label>
              <input
                type="number"
                min={1}
                max={400}
                value={cameraSens}
                onChange={(e) =>
                  onApplyMobileCalibration(
                    Math.max(1, Math.min(400, Number(e.target.value) || 1)),
                    adsSens,
                    gyroSens,
                    mobileSourceGame
                  )
                }
                className="w-full min-h-[44px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 font-mono text-sm text-white focus:border-[#00E5FF] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ADS / Scope (%)
              </label>
              <input
                type="number"
                min={1}
                max={400}
                value={adsSens}
                onChange={(e) =>
                  onApplyMobileCalibration(
                    cameraSens,
                    Math.max(1, Math.min(400, Number(e.target.value) || 1)),
                    gyroSens,
                    mobileSourceGame
                  )
                }
                className="w-full min-h-[44px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 font-mono text-sm text-white focus:border-[#00E5FF] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gyroscope (%)
              </label>
              <input
                type="number"
                min={0}
                max={500}
                value={gyroSens}
                onChange={(e) =>
                  onApplyMobileCalibration(
                    cameraSens,
                    adsSens,
                    Math.max(0, Math.min(500, Number(e.target.value) || 0)),
                    mobileSourceGame
                  )
                }
                className="w-full min-h-[44px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 font-mono text-sm text-white focus:border-[#00E5FF] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Switching To
              </label>
              <select
                value={mobileTargetGame}
                onChange={(e) => setMobileTargetGame(e.target.value as MobileGameId)}
                className="w-full min-h-[44px] rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 text-sm text-white focus:border-[#00E5FF] focus:outline-hidden cursor-pointer"
              >
                {MOBILE_GAMES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fine-tune Device / Screen Ratio Slider */}
          <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-white">
                Device / Screen Feel Multiplier
              </p>
              <p className="text-[11px] text-slate-400">
                Fine-tune if moving between phone &amp; tablet screen sizes ({mobileFineTune.toFixed(2)}x)
              </p>
            </div>
            <div className="flex items-center gap-3 sm:w-72">
              <input
                type="range"
                min={0.75}
                max={1.25}
                step={0.05}
                value={mobileFineTune}
                onChange={(e) => setMobileFineTune(parseFloat(e.target.value))}
                className="flex-1 accent-[#00E5FF] cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setMobileFineTune(1)}
                className="rounded border border-[#222A3A] bg-[#131822] px-2.5 py-1 font-mono text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                1.00x
              </button>
            </div>
          </div>

          {/* Converted Mobile Output Cards */}
          <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#00E5FF]">
                  Converted {mobileTargetGame} Settings
                </p>
                <p className="text-[11px] text-slate-400">
                  Scaled from {mobileSourceGame} curve ratios
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMobileSummary}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#222A3A] bg-[#131822] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-[#00E5FF] transition-colors cursor-pointer"
                >
                  {copiedMobile ? (
                    <Check className="h-3.5 w-3.5 text-[#00E5FF]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-[#00E5FF]" />
                  )}
                  <span>{copiedMobile ? 'Copied!' : 'Copy Percentages'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onApplyMobileCalibration(
                      convertedMobile.cameraSens,
                      convertedMobile.adsSens,
                      convertedMobile.gyroSens,
                      mobileTargetGame
                    )
                  }
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#FF4655] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#e53947] transition-colors cursor-pointer"
                >
                  <span>Apply to Loadout</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-[#222A3A] pt-4">
              <div>
                <div className="text-[11px] text-slate-400">Camera Sens</div>
                <div className="mt-1 font-mono text-xl sm:text-2xl font-bold tabular-nums text-white">
                  {convertedMobile.cameraSens}%
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">ADS / Scope</div>
                <div className="mt-1 font-mono text-xl sm:text-2xl font-bold tabular-nums text-[#00E5FF]">
                  {convertedMobile.adsSens}%
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Gyroscope</div>
                <div className="mt-1 font-mono text-xl sm:text-2xl font-bold tabular-nums text-[#FF4655]">
                  {convertedMobile.gyroSens}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
