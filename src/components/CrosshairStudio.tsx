import React, { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Check,
  Crosshair,
  RotateCcw,
  Sun,
  Moon,
  Cloud,
  AlertCircle,
  Minus,
  Plus,
} from 'lucide-react';
import {
  CrosshairBackground,
  CrosshairColorPreset,
  CrosshairSettings,
} from '../types';
import {
  COLOR_PRESET_MAP,
  DEFAULT_CROSSHAIR,
  drawCrosshairOnCanvas,
  generateValorantCode,
  parseValorantCode,
} from '../utils/aimMath';

interface CrosshairStudioProps {
  settings: CrosshairSettings;
  onChange: (next: CrosshairSettings) => void;
}

const COLOR_OPTIONS: { id: CrosshairColorPreset; swatch: string }[] = [
  { id: 'Cyan', swatch: '#00E5FF' },
  { id: 'Red', swatch: '#FF4655' },
  { id: 'Green', swatch: '#00FF66' },
  { id: 'Yellow', swatch: '#FFE600' },
  { id: 'White', swatch: '#FFFFFF' },
  { id: 'Pink', swatch: '#FF55FF' },
  { id: 'Custom Hex', swatch: 'conic-gradient(#FF4655,#FFE600,#00FF66,#00E5FF,#FF55FF,#FF4655)' },
];

const BACKGROUNDS: { id: CrosshairBackground; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'Bright Map', icon: Sun },
  { id: 'Dark Corner', icon: Moon },
  { id: 'Blue Sky', icon: Cloud },
];

export const CrosshairStudio: React.FC<CrosshairStudioProps> = ({ settings, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [background, setBackground] = useState<CrosshairBackground>('Bright Map');
  const [codeInput, setCodeInput] = useState<string>(() => generateValorantCode(settings));
  const [codeError, setCodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generatedCode = generateValorantCode(settings);

  useEffect(() => {
    setCodeInput(generatedCode);
    setCodeError(null);
  }, [generatedCode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (background === 'Bright Map') {
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.56);
      sky.addColorStop(0, '#a7cde8');
      sky.addColorStop(1, '#f3e3c3');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.56);

      const sand = ctx.createLinearGradient(0, h * 0.56, 0, h);
      sand.addColorStop(0, '#dec194');
      sand.addColorStop(1, '#be9562');
      ctx.fillStyle = sand;
      ctx.fillRect(0, h * 0.56, w, h * 0.44);

      ctx.fillStyle = '#e7cfab';
      ctx.fillRect(w * 0.1, h * 0.25, w * 0.22, h * 0.36);
      ctx.fillStyle = '#d3b183';
      ctx.fillRect(w * 0.7, h * 0.32, w * 0.2, h * 0.28);
    } else if (background === 'Dark Corner') {
      const corner = ctx.createRadialGradient(w / 2, h / 2, 16, w / 2, h / 2, w * 0.72);
      corner.addColorStop(0, '#1C222E');
      corner.addColorStop(1, '#080A0F');
      ctx.fillStyle = corner;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.fillRect(w * 0.08, h * 0.18, w * 0.18, h * 0.64);
    } else {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#2563EB');
      sky.addColorStop(0.6, '#60A5FA');
      sky.addColorStop(1, '#BAE6FD');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.beginPath();
      ctx.arc(w * 0.24, h * 0.36, 42, 0, Math.PI * 2);
      ctx.arc(w * 0.32, h * 0.34, 50, 0, Math.PI * 2);
      ctx.arc(w * 0.74, h * 0.62, 46, 0, Math.PI * 2);
      ctx.fill();
    }

    drawCrosshairOnCanvas(ctx, w / 2, h / 2, settings, 2);
  }, [settings, background]);

  const handleImportCode = () => {
    const parsed = parseValorantCode(codeInput);
    if (!parsed) {
      setCodeError('Check your code format — example: 0;P;c;5;h;0;0l;4;0o;2;0a;1;1b;0');
      return;
    }
    setCodeError(null);
    onChange(parsed);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const update = <K extends keyof CrosshairSettings>(key: K, value: CrosshairSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const handleDotSizeChange = (val: number) => {
    onChange({
      ...settings,
      centerDot: true,
      centerDotSize: val,
    });
  };

  return (
    <section className="rounded-xl border border-[#222A3A] bg-[#131822] p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#222A3A] pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B0E14] border border-[#222A3A] text-[#FF4655]">
            <Crosshair className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Touch-Friendly Crosshair Studio
            </h2>
            <p className="text-xs text-slate-400">
              Preview on different map backgrounds and paste or copy Valorant codes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onChange(DEFAULT_CROSSHAIR)}
          className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Canvas + Code Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-[#222A3A] bg-[#0B0E14] p-1">
            {BACKGROUNDS.map((bg) => {
              const Icon = bg.icon;
              const active = background === bg.id;
              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setBackground(bg.id)}
                  className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#1A2130] text-[#00E5FF]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{bg.id}</span>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-lg border border-[#222A3A] bg-[#0B0E14]">
            <canvas
              ref={canvasRef}
              width={480}
              height={280}
              className="block w-full h-auto"
            />
          </div>

          {/* Code Copy / Paste Box */}
          <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300">
                Valorant Crosshair Code
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md bg-[#00E5FF] px-3 py-1.5 text-xs font-bold text-[#0B0E14] hover:bg-[#33ecff] transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  setCodeError(null);
                }}
                placeholder="Paste Valorant crosshair code..."
                className="flex-1 min-w-0 min-h-[44px] rounded-lg border border-[#222A3A] bg-[#131822] px-3 py-2 font-mono text-xs text-white focus:border-[#00E5FF] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleImportCode}
                className="shrink-0 min-h-[44px] rounded-lg border border-[#222A3A] bg-[#1A2130] px-4 py-2 text-xs font-semibold text-white hover:border-[#00E5FF] transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>

            {codeError && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#FF4655]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{codeError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Touch-Friendly Swatches + Toggles + Stepper Sliders */}
        <div className="lg:col-span-7 space-y-5">
          {/* Large Color Swatches */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Color Swatches</span>
              <span className="font-mono text-xs text-slate-400">
                {settings.colorPreset === 'Custom Hex'
                  ? settings.customHex.toUpperCase()
                  : COLOR_PRESET_MAP[settings.colorPreset].hex}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {COLOR_OPTIONS.map((c) => {
                const active = settings.colorPreset === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => update('colorPreset', c.id)}
                    className={`flex min-h-[44px] items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'border-[#00E5FF] bg-[#1A2130] text-white'
                        : 'border-[#222A3A] bg-[#0B0E14] text-slate-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-white/25 shrink-0"
                      style={{ background: c.swatch }}
                    />
                    <span>{c.id === 'Red' ? 'Crimson' : c.id}</span>
                  </button>
                );
              })}

              {settings.colorPreset === 'Custom Hex' && (
                <div className="flex min-h-[44px] items-center gap-2 rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3 py-1.5">
                  <input
                    type="color"
                    value={
                      /^#[0-9A-Fa-f]{6}$/.test(settings.customHex)
                        ? settings.customHex
                        : '#00E5FF'
                    }
                    onChange={(e) => update('customHex', e.target.value.toUpperCase())}
                    className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={settings.customHex}
                    maxLength={7}
                    onChange={(e) => update('customHex', e.target.value)}
                    className="w-18 bg-transparent font-mono text-xs text-white focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { key: 'centerDot' as const, label: 'Center Dot' },
              { key: 'outlines' as const, label: 'Outlines' },
              { key: 'outerLines' as const, label: 'Outer Lines' },
            ].map((toggle) => {
              const enabled = settings[toggle.key];
              return (
                <button
                  key={toggle.key}
                  type="button"
                  onClick={() => update(toggle.key, !enabled)}
                  className={`flex min-h-[44px] items-center justify-between rounded-lg border px-3.5 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                    enabled
                      ? 'border-[#00E5FF]/60 bg-[#00E5FF]/10 text-white'
                      : 'border-[#222A3A] bg-[#0B0E14] text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{toggle.label}</span>
                  <span
                    className={`font-mono text-[11px] ${
                      enabled ? 'text-[#00E5FF]' : 'text-slate-500'
                    }`}
                  >
                    {enabled ? 'ON' : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Touch-Friendly Sliders + Large Stepper Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-[#222A3A] bg-[#0B0E14] p-4">
            <StepperSliderRow
              label="Length"
              value={settings.innerLength}
              min={0}
              max={20}
              step={1}
              onChange={(v) => update('innerLength', v)}
            />
            <StepperSliderRow
              label="Thickness"
              value={settings.innerThickness}
              min={1}
              max={10}
              step={1}
              onChange={(v) => update('innerThickness', v)}
            />
            <StepperSliderRow
              label="Gap"
              value={settings.innerOffset}
              min={0}
              max={20}
              step={1}
              onChange={(v) => update('innerOffset', v)}
            />
            <StepperSliderRow
              label={settings.centerDot ? 'Dot Size' : 'Dot Size (Off)'}
              value={settings.centerDotSize}
              min={1}
              max={10}
              step={1}
              onChange={handleDotSizeChange}
            />
            <StepperSliderRow
              label="Opacity"
              value={settings.innerOpacity}
              min={0.1}
              max={1}
              step={0.05}
              onChange={(v) => update('innerOpacity', Number(v.toFixed(2)))}
            />
            {settings.outerLines && (
              <StepperSliderRow
                label="Outer Length"
                value={settings.outerLength}
                min={1}
                max={20}
                step={1}
                onChange={(v) => update('outerLength', v)}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

interface StepperSliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}

const StepperSliderRow: React.FC<StepperSliderRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}) => {
  const clamp = (n: number) => {
    const rounded = step < 1 ? Math.round(n * 100) / 100 : Math.round(n);
    return Math.min(max, Math.max(min, rounded));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="font-mono font-bold tabular-nums text-white">{value}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#222A3A] bg-[#131822] text-white hover:border-[#00E5FF] active:scale-95 transition-all cursor-pointer disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 min-w-0 accent-[#FF4655] cursor-pointer h-6"
        />

        <button
          type="button"
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#222A3A] bg-[#131822] text-white hover:border-[#00E5FF] active:scale-95 transition-all cursor-pointer disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
