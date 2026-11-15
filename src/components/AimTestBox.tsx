import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Crosshair as CrosshairIcon,
  Eye,
  Grid3X3,
  Play,
  RotateCcw,
  Target,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react';
import {
  AimDrillResult,
  CrosshairSettings,
  GameId,
  PlatformMode,
  TrackingDrillResult,
} from '../types';
import { drawCrosshairOnCanvas, getGameYaw } from '../utils/aimMath';

interface AimTestBoxProps {
  platform: PlatformMode;
  dpi: number;
  sensitivity: number;
  cameraSens: number;
  game: GameId;
  crosshair: CrosshairSettings;
}

type WarmupMode = 'tracking' | 'gridshot' | 'reflex';
type TrackingTargetType = 'ball' | 'human';

interface GridTarget {
  id: number;
  nx: number; // normalized 0.15..0.85
  ny: number; // normalized 0.18..0.82
  radiusPx: number;
  spawnTime: number;
}

const DRILL_DURATION_SEC = 30;
const BEST_REFLEX_STORAGE_KEY = 'assetsilo_best_reflex_ms';

function wrapYaw180(deg: number): number {
  let d = ((deg + 180) % 360 + 360) % 360 - 180;
  return d === -180 ? 180 : d;
}

function project3DPoint(
  wx: number,
  wy: number,
  wz: number,
  camYawDeg: number,
  camPitchDeg: number,
  w: number,
  h: number,
  hfovDeg = 96
): { x: number; y: number; depth: number; scale: number } | null {
  const eyeY = 1.65;
  const dx = wx;
  const dy = wy - eyeY;
  const dz = wz;

  const yawRad = (camYawDeg * Math.PI) / 180;
  const pitchRad = (camPitchDeg * Math.PI) / 180;

  // Rotate world into camera space
  const cx = dx * Math.cos(yawRad) - dz * Math.sin(yawRad);
  const cz0 = dx * Math.sin(yawRad) + dz * Math.cos(yawRad);

  const cy = dy * Math.cos(pitchRad) - cz0 * Math.sin(pitchRad);
  const cz = dy * Math.sin(pitchRad) + cz0 * Math.cos(pitchRad);

  if (cz <= 0.2) return null;

  const f = (w / 2) / Math.tan(((hfovDeg * Math.PI) / 180) / 2);
  return {
    x: w / 2 + (cx / cz) * f,
    y: h / 2 - (cy / cz) * f,
    depth: cz,
    scale: f / cz,
  };
}

function draw3DSegment(
  ctx: CanvasRenderingContext2D,
  p1: [number, number, number],
  p2: [number, number, number],
  camYawDeg: number,
  camPitchDeg: number,
  w: number,
  h: number,
  hfovDeg = 96
) {
  const eyeY = 1.65;
  const yawRad = (camYawDeg * Math.PI) / 180;
  const pitchRad = (camPitchDeg * Math.PI) / 180;

  const toCam = (pt: [number, number, number]) => {
    const dx = pt[0];
    const dy = pt[1] - eyeY;
    const dz = pt[2];
    const cx = dx * Math.cos(yawRad) - dz * Math.sin(yawRad);
    const cz0 = dx * Math.sin(yawRad) + dz * Math.cos(yawRad);
    const cy = dy * Math.cos(pitchRad) - cz0 * Math.sin(pitchRad);
    const cz = dy * Math.sin(pitchRad) + cz0 * Math.cos(pitchRad);
    return { cx, cy, cz };
  };

  let a = toCam(p1);
  let b = toCam(p2);
  const near = 0.35;

  if (a.cz < near && b.cz < near) return;
  if (a.cz < near || b.cz < near) {
    const t = (near - a.cz) / (b.cz - a.cz);
    const clipped = {
      cx: a.cx + (b.cx - a.cx) * t,
      cy: a.cy + (b.cy - a.cy) * t,
      cz: near,
    };
    if (a.cz < near) a = clipped;
    else b = clipped;
  }

  const f = (w / 2) / Math.tan(((hfovDeg * Math.PI) / 180) / 2);
  const ax = w / 2 + (a.cx / a.cz) * f;
  const ay = h / 2 - (a.cy / a.cz) * f;
  const bx = w / 2 + (b.cx / b.cz) * f;
  const by = h / 2 - (b.cy / b.cz) * f;

  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
}

export const AimTestBox: React.FC<AimTestBoxProps> = ({
  platform,
  dpi,
  sensitivity,
  cameraSens,
  game,
  crosshair,
}) => {
  const [mode, setMode] = useState<WarmupMode>('tracking');

  // Tracking Arena state & toggles
  const trackingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [trackingState, setTrackingState] = useState<'idle' | 'active' | 'finished'>('idle');
  const [targetType, setTargetType] = useState<TrackingTargetType>('ball');
  const [orbit360, setOrbit360] = useState(true);
  const [verticalWaves, setVerticalWaves] = useState(true);
  const [valorantJump, setValorantJump] = useState(true);
  const [isTrackingLocked, setIsTrackingLocked] = useState(false);
  const [trackingPointerFallback, setTrackingPointerFallback] = useState(false);

  const [trackTimeLeft, setTrackTimeLeft] = useState(DRILL_DURATION_SEC);
  const [liveOnTargetPct, setLiveOnTargetPct] = useState(0);
  const [liveStreakSec, setLiveStreakSec] = useState(0);
  const [liveBestStreakSec, setLiveBestStreakSec] = useState(0);
  const [trackingResult, setTrackingResult] = useState<TrackingDrillResult | null>(null);

  const trackSimRef = useRef({
    camYaw: 0,
    camPitch: 0,
    startTimeMs: 0,
    endTimeMs: 0,
    lastFrameMs: 0,
    onTargetMs: 0,
    elapsedMs: 0,
    currentStreakMs: 0,
    longestStreakMs: 0,
    // Ball state
    ballAngleRad: 0,
    ballDir: 1,
    ballNextDirFlipMs: 0,
    // Human figure state (grounded on y=0)
    humanX: 0,
    humanZ: 9.2,
    humanVx: 3.4,
    humanDir: 1,
    humanNextStrafeMs: 0,
    humanPauseUntilMs: 0,
    humanY: 0,
    humanVy: 0,
    humanNextJumpMs: 0,
  });

  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchPosRef = useRef<{ x: number; y: number } | null>(null);

  // Gridshot Target Tap state
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const [gridState, setGridState] = useState<'idle' | 'active' | 'finished'>('idle');
  const [gridTimeLeft, setGridTimeLeft] = useState(DRILL_DURATION_SEC);
  const [gridHits, setGridHits] = useState(0);
  const [gridShots, setGridShots] = useState(0);
  const [gridHitsPerSec, setGridHitsPerSec] = useState(0);
  const [gridResult, setGridResult] = useState<AimDrillResult | null>(null);
  const gridSimRef = useRef<{
    targets: GridTarget[];
    nextId: number;
    hits: number;
    shots: number;
    score: number;
    streak: number;
    bestStreak: number;
    reactionTimes: number[];
    startTimeMs: number;
    endTimeMs: number;
    hitFlashMs: number;
    missFlashMs: number;
  }>({
    targets: [],
    nextId: 1,
    hits: 0,
    shots: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    reactionTimes: [],
    startTimeMs: 0,
    endTimeMs: 0,
    hitFlashMs: 0,
    missFlashMs: 0,
  });

  // Reflex Speed Test state
  const [reflexPhase, setReflexPhase] = useState<'idle' | 'waiting' | 'ready' | 'early' | 'result'>(
    'idle'
  );
  const [lastReflexMs, setLastReflexMs] = useState<number | null>(null);
  const [reflexHistory, setReflexHistory] = useState<number[]>([]);
  const [bestReflexMs, setBestReflexMs] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(BEST_REFLEX_STORAGE_KEY);
      const parsed = saved ? parseInt(saved, 10) : NaN;
      return isFinite(parsed) && parsed > 0 ? parsed : null;
    } catch {
      return null;
    }
  });
  const reflexTimerRef = useRef<number | null>(null);
  const reflexGoAtRef = useRef<number>(0);

  // Pointer lock listener for Tracking Arena
  useEffect(() => {
    const onLockChange = () => {
      setIsTrackingLocked(document.pointerLockElement === trackingCanvasRef.current);
    };
    const onLockError = () => {
      setTrackingPointerFallback(true);
      setIsTrackingLocked(false);
    };

    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('pointerlockerror', onLockError);
    return () => {
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('pointerlockerror', onLockError);
    };
  }, []);

  // Cleanup reflex timer on unmount
  useEffect(() => {
    return () => {
      if (reflexTimerRef.current) {
        window.clearTimeout(reflexTimerRef.current);
      }
    };
  }, []);

  // Release pointer lock if switching tabs
  useEffect(() => {
    if (mode !== 'tracking' && document.pointerLockElement === trackingCanvasRef.current) {
      document.exitPointerLock?.();
    }
  }, [mode]);

  const finishTracking = useCallback(() => {
    const s = trackSimRef.current;
    const pct = s.elapsedMs > 0 ? Math.round((s.onTargetMs / s.elapsedMs) * 1000) / 10 : 0;
    const longestSec = Math.round((s.longestStreakMs / 1000) * 100) / 100;
    const totalSec = Math.round((s.onTargetMs / 1000) * 100) / 100;

    setTrackingResult({
      timeOnTargetPct: pct,
      longestStreakSec: longestSec,
      totalOnTargetSec: totalSec,
      targetType,
    });
    setTrackingState('finished');

    if (document.pointerLockElement === trackingCanvasRef.current) {
      document.exitPointerLock?.();
    }
  }, [targetType]);

  const startTracking = useCallback(() => {
    const now = performance.now();
    trackSimRef.current = {
      camYaw: 0,
      camPitch: 0,
      startTimeMs: now,
      endTimeMs: now + DRILL_DURATION_SEC * 1000,
      lastFrameMs: now,
      onTargetMs: 0,
      elapsedMs: 0,
      currentStreakMs: 0,
      longestStreakMs: 0,
      ballAngleRad: 0,
      ballDir: 1,
      ballNextDirFlipMs: now + 3500,
      humanX: 0,
      humanZ: 9.2,
      humanVx: 3.4,
      humanDir: 1,
      humanNextStrafeMs: now + 900,
      humanPauseUntilMs: 0,
      humanY: 0,
      humanVy: 0,
      humanNextJumpMs: now + 2200,
    };

    lastMousePosRef.current = null;
    lastTouchPosRef.current = null;
    setTrackTimeLeft(DRILL_DURATION_SEC);
    setLiveOnTargetPct(0);
    setLiveStreakSec(0);
    setLiveBestStreakSec(0);
    setTrackingResult(null);
    setTrackingState('active');

    // Attempt Pointer Lock on non-touch PC environments
    const isTouchCapable =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const canvas = trackingCanvasRef.current;
    if (!isTouchCapable && canvas && canvas.requestPointerLock) {
      try {
        const promise = canvas.requestPointerLock() as unknown as Promise<void> | undefined;
        if (promise && typeof promise.catch === 'function') {
          promise.catch(() => setTrackingPointerFallback(true));
        }
      } catch {
        setTrackingPointerFallback(true);
      }
    }
  }, []);

  const applyTrackingLookDelta = useCallback(
    (dx: number, dy: number, isTouch = false) => {
      const s = trackSimRef.current;
      let degDeltaX = 0;
      let degDeltaY = 0;

      if (isTouch) {
        const touchScale = platform === 'Mobile' ? Math.max(0.35, cameraSens / 85) : 1;
        degDeltaX = dx * 0.24 * touchScale;
        degDeltaY = -dy * 0.2 * touchScale;
      } else {
        const yaw = getGameYaw(game);
        const countsX = dx * (dpi / 96);
        const countsY = dy * (dpi / 96);
        degDeltaX = countsX * sensitivity * yaw;
        degDeltaY = -countsY * sensitivity * yaw;
      }

      s.camYaw = orbit360
        ? wrapYaw180(s.camYaw + degDeltaX)
        : Math.max(-75, Math.min(75, s.camYaw + degDeltaX));
      s.camPitch = Math.max(-42, Math.min(42, s.camPitch + degDeltaY));
    },
    [dpi, sensitivity, cameraSens, game, platform, orbit360]
  );

  // Tracking Arena Animation & Physics Loop
  useEffect(() => {
    if (mode !== 'tracking') return;
    let rafId = 0;
    let uiSyncAccumulator = 0;

    const renderTracking = (now: number) => {
      const canvas = trackingCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const s = trackSimRef.current;
          const dtMs = Math.min(64, Math.max(0, now - (s.lastFrameMs || now)));
          const dtSec = dtMs / 1000;
          s.lastFrameMs = now;

          // Update simulation physics when active or gentle idle preview
          const simTimeSec = now / 1000;
          let targetOnCrosshair = false;

          if (targetType === 'ball') {
            if (trackingState === 'active') {
              if (orbit360) {
                if (now > s.ballNextDirFlipMs) {
                  if (Math.random() < 0.45) s.ballDir *= -1;
                  s.ballNextDirFlipMs = now + 2600 + Math.random() * 2400;
                }
                const speedRad = 0.68 + 0.22 * Math.sin(simTimeSec * 1.4);
                s.ballAngleRad += s.ballDir * speedRad * dtSec;
              } else {
                const maxSweepRad = (52 * Math.PI) / 180;
                s.ballAngleRad = Math.sin(simTimeSec * 1.15) * maxSweepRad;
              }
            } else if (trackingState === 'idle') {
              s.ballAngleRad = Math.sin(simTimeSec * 0.9) * 0.55;
            }
          } else {
            // Grounded Human Figure counter-strafe physics (y=0 floor)
            if (trackingState === 'active') {
              if (now >= s.humanPauseUntilMs) {
                if (now >= s.humanNextStrafeMs) {
                  s.humanDir = Math.random() < 0.72 ? -s.humanDir : s.humanDir;
                  s.humanPauseUntilMs = now + 75 + Math.random() * 85;
                  s.humanNextStrafeMs = now + 520 + Math.random() * 950;
                }
                const targetVx = s.humanDir * 4.55;
                s.humanVx += (targetVx - s.humanVx) * Math.min(1, dtSec * 15);
              } else {
                // Crisp Valorant counter-strafe stop
                s.humanVx += (0 - s.humanVx) * Math.min(1, dtSec * 24);
              }

              s.humanX += s.humanVx * dtSec;
              if (s.humanX > 5.2) {
                s.humanX = 5.2;
                s.humanDir = -1;
                s.humanVx = -Math.abs(s.humanVx);
              } else if (s.humanX < -5.2) {
                s.humanX = -5.2;
                s.humanDir = 1;
                s.humanVx = Math.abs(s.humanVx);
              }

              // Ground jump physics
              if (valorantJump) {
                if (s.humanY === 0 && now >= s.humanNextJumpMs) {
                  s.humanVy = 5.3;
                  s.humanNextJumpMs = now + 1800 + Math.random() * 1900;
                }
                if (s.humanY > 0 || s.humanVy > 0) {
                  s.humanY += s.humanVy * dtSec;
                  s.humanVy -= 14.5 * dtSec;
                  if (s.humanY <= 0) {
                    s.humanY = 0;
                    s.humanVy = 0;
                  }
                }
              } else {
                s.humanY = 0;
                s.humanVy = 0;
              }
            } else if (trackingState === 'idle') {
              s.humanX = Math.sin(simTimeSec * 1.4) * 2.2;
              s.humanY = 0;
            }
          }

          // Clear sky & floor background
          ctx.fillStyle = '#090C12';
          ctx.fillRect(0, 0, w, h);

          // Draw 3D Perspective Grid Room
          ctx.save();
          ctx.strokeStyle = 'rgba(34, 42, 58, 0.9)';
          ctx.lineWidth = 1;

          const roomSize = 14;
          const step = 2;
          // Floor grid (y = 0)
          for (let g = -roomSize; g <= roomSize; g += step) {
            draw3DSegment(ctx, [g, 0, -roomSize], [g, 0, roomSize], s.camYaw, s.camPitch, w, h);
            draw3DSegment(ctx, [-roomSize, 0, g], [roomSize, 0, g], s.camYaw, s.camPitch, w, h);
          }

          // Subtle ceiling grid (y = 6.5m)
          ctx.strokeStyle = 'rgba(34, 42, 58, 0.45)';
          for (let g = -roomSize; g <= roomSize; g += step * 2) {
            draw3DSegment(ctx, [g, 6.5, -roomSize], [g, 6.5, roomSize], s.camYaw, s.camPitch, w, h);
            draw3DSegment(ctx, [-roomSize, 6.5, g], [roomSize, 6.5, g], s.camYaw, s.camPitch, w, h);
          }

          // Perimeter vertical wall pillars (creates strong 3D orientation when orbiting 360°)
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.14)';
          for (let g = -roomSize; g <= roomSize; g += 4) {
            draw3DSegment(ctx, [g, 0, roomSize], [g, 6.5, roomSize], s.camYaw, s.camPitch, w, h);
            draw3DSegment(ctx, [g, 0, -roomSize], [g, 6.5, -roomSize], s.camYaw, s.camPitch, w, h);
            draw3DSegment(ctx, [roomSize, 0, g], [roomSize, 6.5, g], s.camYaw, s.camPitch, w, h);
            draw3DSegment(ctx, [-roomSize, 0, g], [-roomSize, 6.5, g], s.camYaw, s.camPitch, w, h);
          }

          // Mid-wall horizon reference rail
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
          ctx.lineWidth = 1.4;
          draw3DSegment(ctx, [-roomSize, 1.65, roomSize], [roomSize, 1.65, roomSize], s.camYaw, s.camPitch, w, h);
          draw3DSegment(ctx, [roomSize, 1.65, roomSize], [roomSize, 1.65, -roomSize], s.camYaw, s.camPitch, w, h);
          draw3DSegment(ctx, [roomSize, 1.65, -roomSize], [-roomSize, 1.65, -roomSize], s.camYaw, s.camPitch, w, h);
          draw3DSegment(ctx, [-roomSize, 1.65, -roomSize], [-roomSize, 1.65, roomSize], s.camYaw, s.camPitch, w, h);
          ctx.restore();

          // Render Active Target & Check Hitbox against center (w/2, h/2)
          const cxScreen = w / 2;
          const cyScreen = h / 2;
          let offscreenIndicatorAngle: number | null = null;
          let offscreenDeltaDeg = 0;

          if (targetType === 'ball') {
            const radius = 8.5;
            const bx = Math.sin(s.ballAngleRad) * radius;
            const bz = Math.cos(s.ballAngleRad) * radius;
            const by = verticalWaves
              ? 1.75 + Math.sin(simTimeSec * 2.1) * 1.15 + Math.sin(simTimeSec * 0.9) * 0.35
              : 1.65;

            const proj = project3DPoint(bx, by, bz, s.camYaw, s.camPitch, w, h);
            const worldRadius = 0.56;

            if (proj && proj.depth > 0.3) {
              const pxRadius = worldRadius * proj.scale;
              const distToCenter = Math.hypot(proj.x - cxScreen, proj.y - cyScreen);
              targetOnCrosshair = distToCenter <= pxRadius;

              // Check if clipped outside viewport
              if (
                proj.x + pxRadius < 0 ||
                proj.x - pxRadius > w ||
                proj.y + pxRadius < 0 ||
                proj.y - pxRadius > h
              ) {
                offscreenIndicatorAngle = Math.atan2(proj.y - cyScreen, proj.x - cxScreen);
              }

              // Floor shadow directly below ball
              const floorProj = project3DPoint(bx, 0, bz, s.camYaw, s.camPitch, w, h);
              if (floorProj) {
                ctx.save();
                ctx.fillStyle = targetOnCrosshair
                  ? 'rgba(0, 229, 255, 0.2)'
                  : 'rgba(255, 70, 85, 0.18)';
                ctx.beginPath();
                ctx.ellipse(
                  floorProj.x,
                  floorProj.y,
                  Math.max(6, 0.42 * floorProj.scale),
                  Math.max(3, 0.14 * floorProj.scale),
                  0,
                  0,
                  Math.PI * 2
                );
                ctx.fill();
                ctx.restore();
              }

              // Draw Target Orb (Cyan on lock, Crimson off target)
              ctx.save();
              const glow = ctx.createRadialGradient(
                proj.x,
                proj.y,
                pxRadius * 0.2,
                proj.x,
                proj.y,
                pxRadius * 1.65
              );
              glow.addColorStop(
                0,
                targetOnCrosshair ? 'rgba(0, 229, 255, 0.45)' : 'rgba(255, 70, 85, 0.35)'
              );
              glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = glow;
              ctx.beginPath();
              ctx.arc(proj.x, proj.y, pxRadius * 1.65, 0, Math.PI * 2);
              ctx.fill();

              const orb = ctx.createRadialGradient(
                proj.x - pxRadius * 0.28,
                proj.y - pxRadius * 0.28,
                pxRadius * 0.12,
                proj.x,
                proj.y,
                pxRadius
              );
              orb.addColorStop(0, targetOnCrosshair ? '#ECFEFF' : '#FFE4E6');
              orb.addColorStop(0.55, targetOnCrosshair ? '#00E5FF' : '#FF4655');
              orb.addColorStop(1, targetOnCrosshair ? '#0284C7' : '#9F1239');
              ctx.fillStyle = orb;
              ctx.beginPath();
              ctx.arc(proj.x, proj.y, pxRadius, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = targetOnCrosshair ? '#FFFFFF' : 'rgba(255,255,255,0.6)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(proj.x, proj.y, pxRadius, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            } else {
              // Ball is behind camera -> compute directional arrow!
              const targetDeg = wrapYaw180((s.ballAngleRad * 180) / Math.PI);
              const deltaYaw = wrapYaw180(targetDeg - s.camYaw);
              offscreenDeltaDeg = deltaYaw;
              offscreenIndicatorAngle = deltaYaw >= 0 ? 0 : Math.PI;
            }

            // Also compute deltaYaw for crisp indicator when offscreen horizontally
            if (offscreenIndicatorAngle !== null && offscreenDeltaDeg === 0) {
              const targetDeg = wrapYaw180((s.ballAngleRad * 180) / Math.PI);
              offscreenDeltaDeg = wrapYaw180(targetDeg - s.camYaw);
            }
          } else {
            // Grounded Human Tactical Silhouette (feet planted on floor y=0 + jump)
            const fx = s.humanX;
            const fz = s.humanZ;
            const fy = s.humanY;

            // Ground shadow ALWAYS anchored on y=0
            const shadowProj = project3DPoint(fx, 0, fz, s.camYaw, s.camPitch, w, h);
            const feetProj = project3DPoint(fx, fy, fz, s.camYaw, s.camPitch, w, h);
            const waistProj = project3DPoint(fx, fy + 0.9, fz, s.camYaw, s.camPitch, w, h);
            const chestTopProj = project3DPoint(fx, fy + 1.44, fz, s.camYaw, s.camPitch, w, h);
            const headProj = project3DPoint(fx, fy + 1.64, fz, s.camYaw, s.camPitch, w, h);

            if (shadowProj) {
              const shadowScale = Math.max(0.45, 1 - fy * 0.35);
              ctx.save();
              ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
              ctx.beginPath();
              ctx.ellipse(
                shadowProj.x,
                shadowProj.y,
                0.38 * shadowProj.scale * shadowScale,
                0.11 * shadowProj.scale * shadowScale,
                0,
                0,
                Math.PI * 2
              );
              ctx.fill();
              ctx.restore();
            }

            if (feetProj && waistProj && chestTopProj && headProj) {
              const sc = headProj.scale;
              const headRadius = 0.16 * sc;
              const shoulderW = 0.52 * sc;
              const waistW = 0.36 * sc;
              const legW = 0.13 * sc;

              // Check Head + Body + Leg hitbox at center crosshair
              const inHead = Math.hypot(cxScreen - headProj.x, cyScreen - headProj.y) <= headRadius;
              const inTorso =
                cxScreen >= chestTopProj.x - shoulderW / 2 &&
                cxScreen <= chestTopProj.x + shoulderW / 2 &&
                cyScreen >= chestTopProj.y &&
                cyScreen <= waistProj.y;
              const inLegs =
                cxScreen >= waistProj.x - waistW / 2 &&
                cxScreen <= waistProj.x + waistW / 2 &&
                cyScreen >= waistProj.y &&
                cyScreen <= feetProj.y;

              targetOnCrosshair = inHead || inTorso || inLegs;

              const primaryFill = targetOnCrosshair ? '#00E5FF' : '#FF4655';
              const strokeCol = targetOnCrosshair ? '#ECFEFF' : '#FFE4E6';

              ctx.save();
              ctx.shadowColor = targetOnCrosshair
                ? 'rgba(0, 229, 255, 0.65)'
                : 'rgba(255, 70, 85, 0.45)';
              ctx.shadowBlur = targetOnCrosshair ? 22 : 12;

              // Left & right legs planted at feetProj.y
              ctx.fillStyle = primaryFill;
              ctx.strokeStyle = strokeCol;
              ctx.lineWidth = 1.6;

              const leftLegX = feetProj.x - waistW * 0.3;
              const rightLegX = feetProj.x + waistW * 0.3;
              ctx.fillRect(leftLegX - legW / 2, waistProj.y, legW, feetProj.y - waistProj.y);
              ctx.fillRect(rightLegX - legW / 2, waistProj.y, legW, feetProj.y - waistProj.y);

              // Tactical Torso trapezoid
              ctx.beginPath();
              ctx.moveTo(chestTopProj.x - shoulderW / 2, chestTopProj.y);
              ctx.lineTo(chestTopProj.x + shoulderW / 2, chestTopProj.y);
              ctx.lineTo(waistProj.x + waistW / 2, waistProj.y);
              ctx.lineTo(waistProj.x - waistW / 2, waistProj.y);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Head hitbox
              ctx.beginPath();
              ctx.arc(headProj.x, headProj.y, headRadius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              // Inner tactical visor line
              ctx.shadowBlur = 0;
              ctx.fillStyle = '#0B0E14';
              ctx.fillRect(
                headProj.x - headRadius * 0.55,
                headProj.y - headRadius * 0.15,
                headRadius * 1.1,
                headRadius * 0.28
              );
              ctx.restore();
            } else {
              const targetDeg = wrapYaw180((Math.atan2(fx, fz) * 180) / Math.PI);
              offscreenDeltaDeg = wrapYaw180(targetDeg - s.camYaw);
              offscreenIndicatorAngle = offscreenDeltaDeg >= 0 ? 0 : Math.PI;
            }
          }

          // Update 30-second tracking score when active
          if (trackingState === 'active') {
            s.elapsedMs += dtMs;
            if (targetOnCrosshair) {
              s.onTargetMs += dtMs;
              s.currentStreakMs += dtMs;
              s.longestStreakMs = Math.max(s.longestStreakMs, s.currentStreakMs);
            } else {
              s.currentStreakMs = 0;
            }

            uiSyncAccumulator += dtMs;
            if (uiSyncAccumulator >= 80) {
              uiSyncAccumulator = 0;
              const rem = Math.max(0, (s.endTimeMs - now) / 1000);
              setTrackTimeLeft(Math.ceil(rem));
              setLiveOnTargetPct(
                s.elapsedMs > 0 ? Math.round((s.onTargetMs / s.elapsedMs) * 1000) / 10 : 0
              );
              setLiveStreakSec(Math.round((s.currentStreakMs / 1000) * 100) / 100);
              setLiveBestStreakSec(Math.round((s.longestStreakMs / 1000) * 100) / 100);
            }

            if (now >= s.endTimeMs) {
              finishTracking();
            }
          }

          // Directional Edge Arrow Indicator when offscreen (360° Orbit)
          if (offscreenIndicatorAngle !== null && trackingState === 'active') {
            const isRight = Math.abs(offscreenIndicatorAngle) < Math.PI / 2;
            const arrowX = isRight ? w - 30 : 30;
            const arrowY = h / 2;
            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.fillStyle = '#FF4655';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (isRight) {
              ctx.moveTo(12, 0);
              ctx.lineTo(-8, -12);
              ctx.lineTo(-4, 0);
              ctx.lineTo(-8, 12);
            } else {
              ctx.moveTo(-12, 0);
              ctx.lineTo(8, -12);
              ctx.lineTo(4, 0);
              ctx.lineTo(8, 12);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 11px "JetBrains Mono", monospace';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.abs(Math.round(offscreenDeltaDeg))}°`, 0, 26);
            ctx.restore();
          }

          // Top Degree Compass Strip
          ctx.save();
          ctx.fillStyle = 'rgba(11, 14, 20, 0.82)';
          ctx.fillRect(w / 2 - 190, 8, 380, 30);
          ctx.strokeStyle = '#222A3A';
          ctx.strokeRect(w / 2 - 190, 8, 380, 30);

          ctx.beginPath();
          ctx.rect(w / 2 - 188, 8, 376, 30);
          ctx.clip();

          const compassPxPerDeg = 3.6;
          for (let deg = -240; deg <= 240; deg += 15) {
            const delta = wrapYaw180(deg - s.camYaw);
            const tx = w / 2 + delta * compassPxPerDeg;
            if (tx < w / 2 - 195 || tx > w / 2 + 195) continue;

            const isMajor = deg % 45 === 0;
            ctx.strokeStyle = isMajor ? '#00E5FF' : 'rgba(148, 163, 184, 0.45)';
            ctx.beginPath();
            ctx.moveTo(tx, 10);
            ctx.lineTo(tx, isMajor ? 20 : 16);
            ctx.stroke();

            if (isMajor) {
              const normDeg = ((deg % 360) + 360) % 360;
              const label =
                normDeg === 0
                  ? 'N'
                  : normDeg === 90
                  ? 'E'
                  : normDeg === 180
                  ? 'S'
                  : normDeg === 270
                  ? 'W'
                  : `${normDeg}°`;
              ctx.fillStyle = normDeg === 0 ? '#00E5FF' : '#CBD5E1';
              ctx.font = '600 10px "JetBrains Mono", monospace';
              ctx.textAlign = 'center';
              ctx.fillText(label, tx, 32);
            }
          }
          ctx.restore();

          // Center Compass Caret
          ctx.fillStyle = '#FF4655';
          ctx.beginPath();
          ctx.moveTo(w / 2, 41);
          ctx.lineTo(w / 2 - 5, 47);
          ctx.lineTo(w / 2 + 5, 47);
          ctx.closePath();
          ctx.fill();

          // Fixed Center Crosshair
          drawCrosshairOnCanvas(ctx, cxScreen, cyScreen, crosshair, 1.45);
        }
      }

      rafId = requestAnimationFrame(renderTracking);
    };

    rafId = requestAnimationFrame(renderTracking);
    return () => cancelAnimationFrame(rafId);
  }, [
    mode,
    trackingState,
    targetType,
    orbit360,
    verticalWaves,
    valorantJump,
    crosshair,
    finishTracking,
  ]);

  const handleTrackingMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (trackingState !== 'active') return;
    if (document.pointerLockElement === trackingCanvasRef.current) {
      applyTrackingLookDelta(e.movementX, e.movementY, false);
    } else if (trackingPointerFallback) {
      if (lastMousePosRef.current) {
        applyTrackingLookDelta(
          e.clientX - lastMousePosRef.current.x,
          e.clientY - lastMousePosRef.current.y,
          false
        );
      }
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleTrackingMouseDown = () => {
    if (trackingState !== 'active') return;
    if (document.pointerLockElement !== trackingCanvasRef.current && !trackingPointerFallback) {
      try {
        trackingCanvasRef.current?.requestPointerLock?.();
      } catch {
        setTrackingPointerFallback(true);
      }
    }
  };

  const handleTrackingTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (trackingState !== 'active') return;
    const t = e.touches[0];
    if (t) {
      lastTouchPosRef.current = { x: t.clientX, y: t.clientY };
    }
  };

  const handleTrackingTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (trackingState !== 'active') return;
    const t = e.touches[0];
    if (!t) return;
    if (lastTouchPosRef.current) {
      applyTrackingLookDelta(
        t.clientX - lastTouchPosRef.current.x,
        t.clientY - lastTouchPosRef.current.y,
        true
      );
    }
    lastTouchPosRef.current = { x: t.clientX, y: t.clientY };
  };

  // ==================== MODE B: GRIDSHOT TARGET TAP ====================
  const spawnGridTarget = useCallback((existing: GridTarget[], nextId: number): GridTarget => {
    for (let attempt = 0; attempt < 25; attempt++) {
      const nx = 0.14 + Math.random() * 0.72;
      const ny = 0.18 + Math.random() * 0.64;
      const tooClose = existing.some((t) => Math.hypot(t.nx - nx, t.ny - ny) < 0.16);
      if (!tooClose) {
        return { id: nextId, nx, ny, radiusPx: 30, spawnTime: performance.now() };
      }
    }
    return {
      id: nextId,
      nx: 0.2 + Math.random() * 0.6,
      ny: 0.25 + Math.random() * 0.5,
      radiusPx: 30,
      spawnTime: performance.now(),
    };
  }, []);

  const startGridshot = useCallback(() => {
    const now = performance.now();
    const initialTargets: GridTarget[] = [];
    let idCounter = 1;
    for (let i = 0; i < 3; i++) {
      initialTargets.push(spawnGridTarget(initialTargets, idCounter++));
    }
    gridSimRef.current = {
      targets: initialTargets,
      nextId: idCounter,
      hits: 0,
      shots: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      reactionTimes: [],
      startTimeMs: now,
      endTimeMs: now + DRILL_DURATION_SEC * 1000,
      hitFlashMs: 0,
      missFlashMs: 0,
    };
    setGridTimeLeft(DRILL_DURATION_SEC);
    setGridHits(0);
    setGridShots(0);
    setGridHitsPerSec(0);
    setGridResult(null);
    setGridState('active');
  }, [spawnGridTarget]);

  const finishGridshot = useCallback(() => {
    const g = gridSimRef.current;
    const accuracy = g.shots > 0 ? Math.round((g.hits / g.shots) * 100) : 0;
    const avgReactionMs =
      g.reactionTimes.length > 0
        ? Math.round(g.reactionTimes.reduce((a, b) => a + b, 0) / g.reactionTimes.length)
        : 0;
    const hps = Math.round((g.hits / DRILL_DURATION_SEC) * 100) / 100;

    setGridResult({
      score: g.score,
      hits: g.hits,
      shots: g.shots,
      accuracy,
      avgReactionMs,
      hitsPerSec: hps,
      bestStreak: g.bestStreak,
    });
    setGridState('finished');
  }, []);

  useEffect(() => {
    if (mode !== 'gridshot') return;
    let rafId = 0;

    const renderGrid = (now: number) => {
      const canvas = gridCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const g = gridSimRef.current;

          if (gridState === 'active') {
            const rem = Math.max(0, (g.endTimeMs - now) / 1000);
            setGridTimeLeft(Math.ceil(rem));
            const elapsedSec = Math.max(0.25, (now - g.startTimeMs) / 1000);
            setGridHitsPerSec(Math.round((g.hits / elapsedSec) * 100) / 100);
            if (rem <= 0) {
              finishGridshot();
            }
          }

          ctx.fillStyle = '#0B0E14';
          ctx.fillRect(0, 0, w, h);

          // Tactical grid
          ctx.strokeStyle = 'rgba(34, 42, 58, 0.7)';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 48) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
          for (let y = 0; y < h; y += 48) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }

          // Draw 3 Gridshot Orbs
          for (const t of g.targets) {
            const tx = t.nx * w;
            const ty = t.ny * h;
            const tr = t.radiusPx;

            const glow = ctx.createRadialGradient(tx, ty, tr * 0.2, tx, ty, tr * 1.45);
            glow.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
            glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(tx, ty, tr * 1.45, 0, Math.PI * 2);
            ctx.fill();

            const orb = ctx.createRadialGradient(
              tx - tr * 0.3,
              ty - tr * 0.3,
              tr * 0.1,
              tx,
              ty,
              tr
            );
            orb.addColorStop(0, '#ECFEFF');
            orb.addColorStop(0.55, '#00E5FF');
            orb.addColorStop(1, '#0369A1');
            ctx.fillStyle = orb;
            ctx.beginPath();
            ctx.arc(tx, ty, tr, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(tx, ty, tr * 0.42, 0, Math.PI * 2);
            ctx.stroke();
          }

          if (now - g.hitFlashMs < 90) {
            ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
            ctx.fillRect(0, 0, w, h);
          } else if (now - g.missFlashMs < 110) {
            ctx.fillStyle = 'rgba(255, 70, 85, 0.12)';
            ctx.fillRect(0, 0, w, h);
          }
        }
      }
      rafId = requestAnimationFrame(renderGrid);
    };

    rafId = requestAnimationFrame(renderGrid);
    return () => cancelAnimationFrame(rafId);
  }, [mode, gridState, finishGridshot]);

  const handleGridshotPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gridState !== 'active') return;
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    const g = gridSimRef.current;
    g.shots += 1;
    const now = performance.now();

    const hitIndex = g.targets.findIndex((t) => {
      const tx = t.nx * canvas.width;
      const ty = t.ny * canvas.height;
      // Generous touch hitbox bonus on coarse touch input
      const hitPad = e.pointerType === 'touch' ? 10 : 4;
      return Math.hypot(px - tx, py - ty) <= t.radiusPx + hitPad;
    });

    if (hitIndex !== -1) {
      const hitTarget = g.targets[hitIndex];
      const reaction = Math.round(now - hitTarget.spawnTime);
      g.hits += 1;
      g.streak += 1;
      g.bestStreak = Math.max(g.bestStreak, g.streak);
      g.reactionTimes.push(reaction);
      g.score += 100;
      g.hitFlashMs = now;

      const remaining = g.targets.filter((_, idx) => idx !== hitIndex);
      remaining.push(spawnGridTarget(remaining, g.nextId++));
      g.targets = remaining;
    } else {
      g.streak = 0;
      g.missFlashMs = now;
    }

    setGridHits(g.hits);
    setGridShots(g.shots);
  };

  // ==================== MODE C: REFLEX SPEED TEST ====================
  const startReflexRound = () => {
    if (reflexTimerRef.current) window.clearTimeout(reflexTimerRef.current);
    setReflexPhase('waiting');
    const delayMs = 1400 + Math.random() * 2600;
    reflexTimerRef.current = window.setTimeout(() => {
      reflexGoAtRef.current = performance.now();
      setReflexPhase('ready');
    }, delayMs);
  };

  const handleReflexTap = () => {
    if (reflexPhase === 'idle' || reflexPhase === 'early' || reflexPhase === 'result') {
      startReflexRound();
      return;
    }

    if (reflexPhase === 'waiting') {
      if (reflexTimerRef.current) window.clearTimeout(reflexTimerRef.current);
      setReflexPhase('early');
      return;
    }

    if (reflexPhase === 'ready') {
      const reaction = Math.max(1, Math.round(performance.now() - reflexGoAtRef.current));
      setLastReflexMs(reaction);
      setReflexHistory((prev) => [reaction, ...prev].slice(0, 8));
      if (bestReflexMs === null || reaction < bestReflexMs) {
        setBestReflexMs(reaction);
        try {
          localStorage.setItem(BEST_REFLEX_STORAGE_KEY, String(reaction));
        } catch {
          // ignore storage errors
        }
      }
      setReflexPhase('result');
    }
  };

  const gridAccuracy = gridShots > 0 ? Math.round((gridHits / gridShots) * 100) : 0;
  const reflexAvgMs =
    reflexHistory.length > 0
      ? Math.round(reflexHistory.reduce((a, b) => a + b, 0) / reflexHistory.length)
      : null;

  return (
    <section className="rounded-xl border border-[#222A3A] bg-[#131822] p-4 sm:p-6 space-y-5">
      {/* Section Header + 3-Mode Tabs */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-[#222A3A] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B0E14] border border-[#222A3A] text-[#00E5FF]">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Aim &amp; Reflex Warmup
            </h2>
            <p className="text-xs text-slate-400">
              Built for both PC Mouse (Pointer Lock) and Mobile Touchscreen drag/tap
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-lg border border-[#222A3A] bg-[#0B0E14] p-1">
          {(
            [
              { id: 'tracking', label: 'Tracking Arena', icon: Eye },
              { id: 'gridshot', label: 'Gridshot Tap', icon: Grid3X3 },
              { id: 'reflex', label: 'Reflex Test', icon: Zap },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#FF4655] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== MODE A: TRACKING ARENA ==================== */}
      {mode === 'tracking' && (
        <div className="space-y-4">
          {/* Target Type & Motion Toggles */}
          <div className="flex flex-col gap-3 rounded-lg border border-[#222A3A] bg-[#0B0E14] p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1">Target:</span>
              <div className="grid grid-cols-2 rounded-lg border border-[#222A3A] bg-[#131822] p-1">
                <button
                  type="button"
                  onClick={() => setTargetType('ball')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer min-h-[36px] ${
                    targetType === 'ball'
                      ? 'bg-[#00E5FF] text-[#0B0E14]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Ball / Orb
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('human')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer min-h-[36px] ${
                    targetType === 'human'
                      ? 'bg-[#00E5FF] text-[#0B0E14]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Human Figure
                </button>
              </div>
            </div>

            {targetType === 'ball' ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrbit360((v) => !v)}
                  className={`min-h-[38px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    orbit360
                      ? 'border-[#00E5FF]/60 bg-[#00E5FF]/10 text-[#00E5FF]'
                      : 'border-[#222A3A] bg-[#131822] text-slate-400 hover:text-white'
                  }`}
                >
                  360° Orbit: {orbit360 ? 'ON' : 'OFF (120°)'}
                </button>
                <button
                  type="button"
                  onClick={() => setVerticalWaves((v) => !v)}
                  className={`min-h-[38px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    verticalWaves
                      ? 'border-[#00E5FF]/60 bg-[#00E5FF]/10 text-[#00E5FF]'
                      : 'border-[#222A3A] bg-[#131822] text-slate-400 hover:text-white'
                  }`}
                >
                  Up &amp; Down Motion: {verticalWaves ? 'ON' : 'OFF'}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setValorantJump((v) => !v)}
                  className={`min-h-[38px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    valorantJump
                      ? 'border-[#00E5FF]/60 bg-[#00E5FF]/10 text-[#00E5FF]'
                      : 'border-[#222A3A] bg-[#131822] text-slate-400 hover:text-white'
                  }`}
                >
                  Valorant Jump: {valorantJump ? 'ON' : 'OFF'}
                </button>
                <span className="text-[11px] text-slate-400">
                  Grounded counter-strafe figure
                </span>
              </div>
            )}
          </div>

          {/* Live Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Timer className="h-3.5 w-3.5 text-[#FF4655]" />
                <span className="hidden sm:inline">Time Left</span>
              </span>
              <span className="font-mono text-base font-bold tabular-nums text-white">
                {trackTimeLeft}s
              </span>
            </div>

            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Activity className="h-3.5 w-3.5 text-[#00E5FF]" />
                <span>On Target</span>
              </span>
              <span className="font-mono text-base font-bold tabular-nums text-[#00E5FF]">
                {liveOnTargetPct}%
              </span>
            </div>

            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] px-3.5 py-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Trophy className="h-3.5 w-3.5 text-[#FF4655]" />
                <span className="hidden sm:inline">Lock Streak</span>
              </span>
              <span className="font-mono text-base font-bold tabular-nums text-white">
                {liveStreakSec.toFixed(1)}s{' '}
                <span className="text-[11px] text-slate-500">
                  (Best {liveBestStreakSec.toFixed(1)}s)
                </span>
              </span>
            </div>
          </div>

          {/* 3D Perspective Tracking Arena Canvas */}
          <div className="relative overflow-hidden rounded-lg border border-[#222A3A] bg-[#0B0E14] select-none">
            <canvas
              ref={trackingCanvasRef}
              width={960}
              height={460}
              onMouseMove={handleTrackingMouseMove}
              onMouseDown={handleTrackingMouseDown}
              onMouseLeave={() => {
                lastMousePosRef.current = null;
              }}
              onTouchStart={handleTrackingTouchStart}
              onTouchMove={handleTrackingTouchMove}
              onTouchEnd={() => {
                lastTouchPosRef.current = null;
              }}
              className={`block w-full h-auto aspect-4/3 sm:aspect-16/8 touch-none ${
                trackingState === 'active' ? 'cursor-none' : 'cursor-pointer'
              }`}
            />

            {trackingState === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0E14]/78 backdrop-blur-[2px] p-6 text-center">
                <h3 className="font-display text-xl font-bold text-white">
                  Tracking Arena (No Shooting Required)
                </h3>
                <p className="mt-1.5 max-w-md text-xs text-slate-300 leading-relaxed">
                  Keep your crosshair locked on the target for 30 seconds — it glows{' '}
                  <span className="text-[#00E5FF] font-semibold">Cyan</span> when locked and{' '}
                  <span className="text-[#FF4655] font-semibold">Crimson</span> when off. Drag
                  with your thumb on mobile or use mouse look on PC.
                </p>
                <button
                  type="button"
                  onClick={startTracking}
                  className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#FF4655] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#e53947] transition-colors cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start 30s Tracking</span>
                </button>
              </div>
            )}

            {trackingState === 'active' && (
              <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[11px] text-slate-300 bg-[#0B0E14]/85 border border-[#222A3A] rounded px-2.5 py-1">
                {isTrackingLocked
                  ? 'Pointer Locked · ESC to release'
                  : trackingPointerFallback
                  ? 'Mouse Look / Touch Drag Active'
                  : 'Click arena for Pointer Lock · Drag thumb on mobile'}
              </div>
            )}

            {trackingState === 'finished' && trackingResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0E14]/92 backdrop-blur-xs p-6 text-center">
                <p className="text-xs font-semibold text-[#00E5FF]">Tracking Complete</p>
                <h3 className="font-display text-2xl font-bold text-white mt-1">
                  {trackingResult.timeOnTargetPct}% Time on Target
                </h3>

                <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-md">
                  <div className="rounded-lg border border-[#222A3A] bg-[#131822] p-3">
                    <div className="text-[11px] text-slate-400">Time on Target</div>
                    <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#00E5FF]">
                      {trackingResult.timeOnTargetPct}%
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#222A3A] bg-[#131822] p-3">
                    <div className="text-[11px] text-slate-400">Longest Lock Streak</div>
                    <div className="mt-1 font-mono text-xl font-bold tabular-nums text-white">
                      {trackingResult.longestStreakSec}s
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#222A3A] bg-[#131822] p-3">
                    <div className="text-[11px] text-slate-400">Total Locked</div>
                    <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#FF4655]">
                      {trackingResult.totalOnTargetSec}s
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startTracking}
                  className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#FF4655] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#e53947] transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Track Again</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODE B: GRIDSHOT TARGET TAP ==================== */}
      {mode === 'gridshot' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] px-4 py-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Timer className="h-3.5 w-3.5 text-[#FF4655]" />
                Time Left
              </span>
              <span className="font-mono text-base font-bold tabular-nums text-white">
                {gridTimeLeft}s
              </span>
            </div>

            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] px-4 py-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Target className="h-3.5 w-3.5 text-[#00E5FF]" />
                Hits
              </span>
              <span className="font-mono text-base font-bold tabular-nums text-white">
                {gridHits}
              </span>
            </div>

            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] px-4 py-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <CrosshairIcon className="h-3.5 w-3.5 text-[#00E5FF]" />
                Accuracy
              </span>
              <span className="font-mono text-base font-bold tabular-nums text-white">
                {gridShots > 0 ? `${gridAccuracy}%` : '—'}
              </span>
            </div>

            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] px-4 py-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Zap className="h-3.5 w-3.5 text-[#FF4655]" />
                Hits/Sec
              </span>
              <span className="font-mono text-base font-bold tabular-nums text-white">
                {gridHitsPerSec > 0 ? gridHitsPerSec.toFixed(2) : '—'}
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-[#222A3A] bg-[#0B0E14] select-none">
            <canvas
              ref={gridCanvasRef}
              width={960}
              height={460}
              onPointerDown={handleGridshotPointerDown}
              className="block w-full h-auto aspect-4/3 sm:aspect-16/8 touch-none cursor-crosshair"
            />

            {gridState === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0E14]/78 backdrop-blur-[2px] p-6 text-center">
                <h3 className="font-display text-xl font-bold text-white">
                  Gridshot Target Tap (30s)
                </h3>
                <p className="mt-1.5 max-w-md text-xs text-slate-300 leading-relaxed">
                  Click or tap targets as fast as possible — 3 orbs stay active at all times to
                  build flick speed and finger accuracy.
                </p>
                <button
                  type="button"
                  onClick={startGridshot}
                  className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#FF4655] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#e53947] transition-colors cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start 30s Gridshot</span>
                </button>
              </div>
            )}

            {gridState === 'finished' && gridResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0E14]/92 backdrop-blur-xs p-6 text-center">
                <p className="text-xs font-semibold text-[#00E5FF]">Gridshot Complete</p>
                <h3 className="font-display text-2xl font-bold text-white mt-1">
                  {gridResult.hits} Hits · {gridResult.accuracy}% Accuracy
                </h3>

                <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-md">
                  <div className="rounded-lg border border-[#222A3A] bg-[#131822] p-3">
                    <div className="text-[11px] text-slate-400">Hits</div>
                    <div className="mt-1 font-mono text-xl font-bold tabular-nums text-white">
                      {gridResult.hits}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {gridResult.shots} taps
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#222A3A] bg-[#131822] p-3">
                    <div className="text-[11px] text-slate-400">Accuracy</div>
                    <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#00E5FF]">
                      {gridResult.accuracy}%
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">Hit rate</div>
                  </div>

                  <div className="rounded-lg border border-[#222A3A] bg-[#131822] p-3">
                    <div className="text-[11px] text-slate-400">Hits/Sec</div>
                    <div className="mt-1 font-mono text-xl font-bold tabular-nums text-[#FF4655]">
                      {gridResult.hitsPerSec.toFixed(2)}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {gridResult.avgReactionMs} ms avg
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startGridshot}
                  className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#FF4655] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#e53947] transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Play Again</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODE C: REFLEX SPEED TEST ==================== */}
      {mode === 'reflex' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-400">Last Reflex</span>
              <span className="font-mono text-base font-bold tabular-nums text-white">
                {lastReflexMs !== null ? `${lastReflexMs} ms` : '—'}
              </span>
            </div>

            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-400">Session Avg</span>
              <span className="font-mono text-base font-bold tabular-nums text-slate-200">
                {reflexAvgMs !== null ? `${reflexAvgMs} ms` : '—'}
              </span>
            </div>

            <div className="rounded-lg border border-[#222A3A] bg-[#0B0E14] px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-400">Best Reflex</span>
              <span className="font-mono text-base font-bold tabular-nums text-[#00E5FF]">
                {bestReflexMs !== null ? `${bestReflexMs} ms` : '—'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onPointerDown={handleReflexTap}
            className={`flex w-full min-h-[300px] sm:min-h-[340px] flex-col items-center justify-center rounded-xl border p-6 text-center transition-colors select-none cursor-pointer touch-manipulation ${
              reflexPhase === 'waiting'
                ? 'border-[#FF4655] bg-[#FF4655] text-white'
                : reflexPhase === 'ready'
                ? 'border-[#00E5FF] bg-[#00E5FF] text-[#0B0E14]'
                : reflexPhase === 'early'
                ? 'border-[#FF4655]/60 bg-[#1A131C] text-white'
                : 'border-[#222A3A] bg-[#0B0E14] text-white hover:border-[#00E5FF]/50'
            }`}
          >
            {reflexPhase === 'idle' && (
              <>
                <Zap className="h-10 w-10 text-[#00E5FF] mb-3" />
                <h3 className="font-display text-2xl font-bold">Reflex Speed Test</h3>
                <p className="mt-2 max-w-sm text-xs text-slate-300">
                  Screen turns crimson. As soon as it flashes cyan, tap or click anywhere as fast
                  as possible.
                </p>
                <span className="mt-5 inline-flex items-center rounded-lg bg-[#FF4655] px-5 py-2.5 text-xs font-bold text-white">
                  Tap or Click to Start
                </span>
              </>
            )}

            {reflexPhase === 'waiting' && (
              <>
                <h3 className="font-display text-3xl font-extrabold tracking-tight">
                  Wait for Cyan...
                </h3>
                <p className="mt-2 text-xs font-medium text-white/90">
                  Hold steady — do not click early
                </p>
              </>
            )}

            {reflexPhase === 'ready' && (
              <>
                <h3 className="font-display text-4xl font-extrabold tracking-tight">TAP NOW!</h3>
                <p className="mt-2 text-xs font-bold text-[#0B0E14]/80">Click or tap immediately</p>
              </>
            )}

            {reflexPhase === 'early' && (
              <>
                <h3 className="font-display text-2xl font-bold text-[#FF4655]">Too Early!</h3>
                <p className="mt-2 text-xs text-slate-300">
                  You tapped before the screen flashed cyan. Tap anywhere to try again.
                </p>
              </>
            )}

            {reflexPhase === 'result' && lastReflexMs !== null && (
              <>
                <p className="text-xs font-semibold text-[#00E5FF]">Reaction Time</p>
                <div className="mt-1 font-mono text-5xl font-extrabold tabular-nums text-white">
                  {lastReflexMs} ms
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Best saved: <span className="font-mono text-[#00E5FF]">{bestReflexMs} ms</span> ·
                  Tap anywhere to go again
                </p>
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
};
