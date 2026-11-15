import {
  AimConfig,
  CrosshairColorPreset,
  CrosshairSettings,
  FingerSetup,
  GameId,
  MobileGameId,
  PCGameId,
  PlatformMode,
} from '../types';

export const PC_GAMES: { id: PCGameId; yaw: number; defaultSens: number }[] = [
  { id: 'Valorant', yaw: 0.07, defaultSens: 0.35 },
  { id: 'CS2', yaw: 0.022, defaultSens: 1.11 },
  { id: 'Apex Legends', yaw: 0.022, defaultSens: 1.11 },
  { id: 'Overwatch 2', yaw: 0.0066, defaultSens: 3.71 },
];

export const MOBILE_GAMES: {
  id: MobileGameId;
  label: string;
  cameraScale: number;
  adsScale: number;
  gyroScale: number;
  defaultCamera: number;
  defaultAds: number;
  defaultGyro: number;
}[] = [
  {
    id: 'CODM',
    label: 'CODM',
    cameraScale: 1.0,
    adsScale: 1.0,
    gyroScale: 1.0,
    defaultCamera: 85,
    defaultAds: 105,
    defaultGyro: 140,
  },
  {
    id: 'PUBGM',
    label: 'PUBGM',
    cameraScale: 1.35,
    adsScale: 1.28,
    gyroScale: 2.15,
    defaultCamera: 115,
    defaultAds: 135,
    defaultGyro: 300,
  },
  {
    id: 'ROS',
    label: 'ROS',
    cameraScale: 0.72,
    adsScale: 0.7,
    gyroScale: 0.75,
    defaultCamera: 62,
    defaultAds: 74,
    defaultGyro: 105,
  },
  {
    id: 'BloodStrike',
    label: 'BloodStrike',
    cameraScale: 1.12,
    adsScale: 1.08,
    gyroScale: 1.15,
    defaultCamera: 95,
    defaultAds: 115,
    defaultGyro: 160,
  },
];

export const FINGER_SETUPS: FingerSetup[] = [
  '2-Thumb',
  '3-Finger Claw',
  '4-Finger Claw',
  '5-Finger Claw',
  '6-Finger Claw',
];

export const RESOLUTIONS = [
  '1920x1080 (16:9)',
  '2560x1440 (16:9)',
  '1280x960 (4:3 Stretched)',
  '1440x1080 (4:3 Stretched)',
  '1680x1050 (16:10)',
  '3840x2160 (4K)',
];

export function isPCGame(game: GameId): game is PCGameId {
  return PC_GAMES.some((g) => g.id === game);
}

export function isMobileGame(game: GameId): game is MobileGameId {
  return MOBILE_GAMES.some((g) => g.id === game);
}

export function getConfigPlatform(cfg: Pick<AimConfig, 'platform' | 'game' | 'cameraSens'>): PlatformMode {
  if (cfg.platform === 'Mobile') return 'Mobile';
  if (cfg.platform === 'PC') return 'PC';
  if (typeof cfg.cameraSens === 'number') return 'Mobile';
  return isMobileGame(cfg.game) && cfg.game !== 'BloodStrike' ? 'Mobile' : 'PC';
}

export function getGameYaw(game: GameId): number {
  return PC_GAMES.find((g) => g.id === game)?.yaw ?? 0.07;
}

export function calculateEDPI(dpi: number, sensitivity: number): number {
  if (!isFinite(dpi) || !isFinite(sensitivity) || dpi <= 0 || sensitivity <= 0) return 0;
  return Math.round(dpi * sensitivity * 100) / 100;
}

export function calculateCm360(dpi: number, sensitivity: number, game: GameId): number {
  if (!isFinite(dpi) || !isFinite(sensitivity) || dpi <= 0 || sensitivity <= 0) return 0;
  const yaw = getGameYaw(game);
  const cm = 914.4 / (dpi * sensitivity * yaw);
  return Math.round(cm * 100) / 100;
}

export function convertSensitivity(
  sourceSens: number,
  sourceGame: PCGameId,
  targetGame: PCGameId
): number {
  if (!isFinite(sourceSens) || sourceSens <= 0) return 0;
  const sourceYaw = getGameYaw(sourceGame);
  const targetYaw = getGameYaw(targetGame);
  const converted = sourceSens * (sourceYaw / targetYaw);
  return Math.round(converted * 1000) / 1000;
}

export function convertMobileSensitivity(
  cameraSens: number,
  adsSens: number,
  gyroSens: number,
  sourceGame: MobileGameId,
  targetGame: MobileGameId,
  customScale = 1
): { cameraSens: number; adsSens: number; gyroSens: number } {
  const src = MOBILE_GAMES.find((g) => g.id === sourceGame) ?? MOBILE_GAMES[0];
  const dst = MOBILE_GAMES.find((g) => g.id === targetGame) ?? MOBILE_GAMES[0];

  const clampVal = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Math.round(v)));

  return {
    cameraSens: clampVal(cameraSens * (dst.cameraScale / src.cameraScale) * customScale, 1, 400),
    adsSens: clampVal(adsSens * (dst.adsScale / src.adsScale) * customScale, 1, 400),
    gyroSens: clampVal(gyroSens * (dst.gyroScale / src.gyroScale) * customScale, 0, 500),
  };
}

export const COLOR_PRESET_MAP: Record<
  Exclude<CrosshairColorPreset, 'Custom Hex'>,
  { code: number; hex: string }
> = {
  White: { code: 0, hex: '#FFFFFF' },
  Green: { code: 1, hex: '#00FF66' },
  Yellow: { code: 4, hex: '#FFE600' },
  Cyan: { code: 5, hex: '#00E5FF' },
  Pink: { code: 6, hex: '#FF55FF' },
  Red: { code: 7, hex: '#FF4655' },
};

export const DEFAULT_CROSSHAIR: CrosshairSettings = {
  colorPreset: 'Cyan',
  customHex: '#00E5FF',
  centerDot: false,
  centerDotSize: 2,
  centerDotOpacity: 1,
  outlines: false,
  outlineThickness: 1,
  outlineOpacity: 0.6,
  innerLines: true,
  innerLength: 4,
  innerThickness: 2,
  innerOffset: 2,
  innerOpacity: 1,
  outerLines: false,
  outerLength: 2,
  outerThickness: 2,
  outerOffset: 10,
  outerOpacity: 0.35,
};

export function getCrosshairColorHex(settings: CrosshairSettings): string {
  if (settings.colorPreset === 'Custom Hex') {
    const clean = settings.customHex.trim();
    return /^#[0-9A-Fa-f]{6}$/.test(clean) ? clean : '#00E5FF';
  }
  return COLOR_PRESET_MAP[settings.colorPreset].hex;
}

export function generateValorantCode(settings: CrosshairSettings): string {
  const tokens: (string | number)[] = ['0', 'P'];

  if (settings.colorPreset === 'Custom Hex') {
    const cleanHex = getCrosshairColorHex(settings).replace('#', '').toUpperCase();
    tokens.push('c', 8, 'u', `${cleanHex}FF`);
  } else {
    tokens.push('c', COLOR_PRESET_MAP[settings.colorPreset].code);
  }

  tokens.push('h', settings.outlines ? 1 : 0);
  if (settings.outlines) {
    tokens.push('t', settings.outlineThickness);
    tokens.push('o', Number(settings.outlineOpacity.toFixed(2)));
  }

  if (settings.centerDot) {
    tokens.push('d', 1);
    tokens.push('z', settings.centerDotSize);
    tokens.push('a', Number(settings.centerDotOpacity.toFixed(2)));
  }

  if (!settings.innerLines) {
    tokens.push('0b', 0);
  } else {
    tokens.push('0t', settings.innerThickness);
    tokens.push('0l', settings.innerLength);
    tokens.push('0o', settings.innerOffset);
    tokens.push('0a', Number(settings.innerOpacity.toFixed(2)));
  }

  if (!settings.outerLines) {
    tokens.push('1b', 0);
  } else {
    tokens.push('1b', 1);
    tokens.push('1t', settings.outerThickness);
    tokens.push('1l', settings.outerLength);
    tokens.push('1o', settings.outerOffset);
    tokens.push('1a', Number(settings.outerOpacity.toFixed(2)));
  }

  return tokens.join(';');
}

export function parseValorantCode(code: string): CrosshairSettings | null {
  const trimmed = code.trim();
  if (!trimmed || !trimmed.includes(';')) return null;

  const parts = trimmed.split(';');
  const parsed: CrosshairSettings = {
    colorPreset: 'White',
    customHex: '#FFFFFF',
    centerDot: false,
    centerDotSize: 2,
    centerDotOpacity: 1,
    outlines: true,
    outlineThickness: 1,
    outlineOpacity: 0.5,
    innerLines: true,
    innerLength: 6,
    innerThickness: 2,
    innerOffset: 3,
    innerOpacity: 0.8,
    outerLines: true,
    outerLength: 2,
    outerThickness: 2,
    outerOffset: 10,
    outerOpacity: 0.35,
  };

  let idx = 0;
  const pIndex = parts.indexOf('P');
  if (pIndex !== -1) {
    idx = pIndex + 1;
  } else if (parts[0] === '0') {
    idx = 1;
  }

  const clamp = (val: number, min: number, max: number) =>
    isNaN(val) ? min : Math.min(max, Math.max(min, val));

  let foundAnyValidKey = false;

  while (idx < parts.length) {
    const key = parts[idx];
    if (key === 'S' || key === 'A') break;

    const rawVal = parts[idx + 1];
    if (rawVal === undefined) break;

    const numVal = parseFloat(rawVal);

    switch (key) {
      case 'c': {
        foundAnyValidKey = true;
        const cNum = parseInt(rawVal, 10);
        if (cNum === 0) parsed.colorPreset = 'White';
        else if (cNum === 1 || cNum === 2 || cNum === 3) parsed.colorPreset = 'Green';
        else if (cNum === 4) parsed.colorPreset = 'Yellow';
        else if (cNum === 5) parsed.colorPreset = 'Cyan';
        else if (cNum === 6) parsed.colorPreset = 'Pink';
        else if (cNum === 7) parsed.colorPreset = 'Red';
        else if (cNum === 8) parsed.colorPreset = 'Custom Hex';
        break;
      }
      case 'u': {
        foundAnyValidKey = true;
        const hex = rawVal.replace('#', '').slice(0, 6);
        if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
          parsed.customHex = `#${hex.toUpperCase()}`;
          parsed.colorPreset = 'Custom Hex';
        }
        break;
      }
      case 'h':
        foundAnyValidKey = true;
        parsed.outlines = rawVal === '1';
        break;
      case 't':
        foundAnyValidKey = true;
        parsed.outlineThickness = clamp(Math.round(numVal), 1, 6);
        break;
      case 'o':
        foundAnyValidKey = true;
        parsed.outlineOpacity = clamp(numVal, 0, 1);
        break;
      case 'd':
        foundAnyValidKey = true;
        parsed.centerDot = rawVal === '1';
        break;
      case 'z':
        foundAnyValidKey = true;
        parsed.centerDotSize = clamp(Math.round(numVal), 1, 10);
        break;
      case 'a':
        foundAnyValidKey = true;
        parsed.centerDotOpacity = clamp(numVal, 0, 1);
        break;
      case '0b':
        foundAnyValidKey = true;
        parsed.innerLines = rawVal === '1';
        break;
      case '0l':
        foundAnyValidKey = true;
        parsed.innerLength = clamp(Math.round(numVal), 0, 20);
        break;
      case '0t':
        foundAnyValidKey = true;
        parsed.innerThickness = clamp(Math.round(numVal), 1, 10);
        break;
      case '0o':
        foundAnyValidKey = true;
        parsed.innerOffset = clamp(Math.round(numVal), 0, 20);
        break;
      case '0a':
        foundAnyValidKey = true;
        parsed.innerOpacity = clamp(numVal, 0, 1);
        break;
      case '1b':
        foundAnyValidKey = true;
        parsed.outerLines = rawVal === '1';
        break;
      case '1l':
        foundAnyValidKey = true;
        parsed.outerLength = clamp(Math.round(numVal), 0, 20);
        break;
      case '1t':
        foundAnyValidKey = true;
        parsed.outerThickness = clamp(Math.round(numVal), 1, 10);
        break;
      case '1o':
        foundAnyValidKey = true;
        parsed.outerOffset = clamp(Math.round(numVal), 0, 40);
        break;
      case '1a':
        foundAnyValidKey = true;
        parsed.outerOpacity = clamp(numVal, 0, 1);
        break;
      default:
        break;
    }

    idx += 2;
  }

  return foundAnyValidKey ? parsed : null;
}

export function drawCrosshairOnCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  settings: CrosshairSettings,
  scale = 1.6
) {
  const colorHex = getCrosshairColorHex(settings);

  const drawRect = (x: number, y: number, w: number, h: number, opacity: number) => {
    if (w <= 0 || h <= 0 || opacity <= 0) return;

    if (settings.outlines && settings.outlineOpacity > 0) {
      const ot = settings.outlineThickness * scale;
      ctx.save();
      ctx.globalAlpha = settings.outlineOpacity;
      ctx.fillStyle = '#000000';
      ctx.fillRect(x - ot, y - ot, w + ot * 2, h + ot * 2);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = colorHex;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  };

  if (settings.outerLines && settings.outerLength > 0) {
    const len = settings.outerLength * scale;
    const thick = settings.outerThickness * scale;
    const gap = settings.outerOffset * scale;
    const op = settings.outerOpacity;

    drawRect(cx - thick / 2, cy - gap - len, thick, len, op);
    drawRect(cx - thick / 2, cy + gap, thick, len, op);
    drawRect(cx - gap - len, cy - thick / 2, len, thick, op);
    drawRect(cx + gap, cy - thick / 2, len, thick, op);
  }

  if (settings.innerLines && settings.innerLength > 0) {
    const len = settings.innerLength * scale;
    const thick = settings.innerThickness * scale;
    const gap = settings.innerOffset * scale;
    const op = settings.innerOpacity;

    drawRect(cx - thick / 2, cy - gap - len, thick, len, op);
    drawRect(cx - thick / 2, cy + gap, thick, len, op);
    drawRect(cx - gap - len, cy - thick / 2, len, thick, op);
    drawRect(cx + gap, cy - thick / 2, len, thick, op);
  }

  if (settings.centerDot) {
    const dotSize = settings.centerDotSize * scale;
    drawRect(
      cx - dotSize / 2,
      cy - dotSize / 2,
      dotSize,
      dotSize,
      settings.centerDotOpacity
    );
  }
}

export function formatDiscordLoadout(cfg: AimConfig): string {
  const plat = getConfigPlatform(cfg);
  if (plat === 'Mobile') {
    const lines = [
      `**${cfg.name}** (${cfg.game} · Mobile)`,
      `Camera: **${cfg.cameraSens ?? 0}%** | ADS: **${cfg.adsSens ?? 0}%** | Gyro: **${cfg.gyroSens ?? 0}%** | Setup: **${cfg.fingerSetup || '4-Finger Claw'}**`,
      `HUD Share Code: \`${cfg.hudCode || 'N/A'}\``,
    ];
    if (cfg.notes) {
      lines.push(`Notes: ${cfg.notes}`);
    }
    return lines.join('\n');
  }

  const lines = [
    `**${cfg.name}** (${cfg.game} · PC)`,
    `DPI: **${cfg.dpi ?? 800}** | Sens: **${cfg.sensitivity ?? 0.35}** | eDPI: **${cfg.edpi ?? 280}** | 360° Swipe: **${cfg.cm360 ?? 46.7} cm**`,
    `Resolution: ${cfg.resolution || '1920x1080 (16:9)'}`,
    `Crosshair Code: \`${cfg.crosshairCode || 'N/A'}\``,
  ];
  if (cfg.notes) {
    lines.push(`Notes: ${cfg.notes}`);
  }
  return lines.join('\n');
}

export function formatRelativeDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Recently';
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}
