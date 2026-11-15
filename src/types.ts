export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  role: 'freelancer' | 'client';
  createdAt: string;
}

export type PlatformMode = 'PC' | 'Mobile';

export type PCGameId = 'Valorant' | 'CS2' | 'Apex Legends' | 'Overwatch 2';
export type MobileGameId = 'CODM' | 'PUBGM' | 'ROS' | 'BloodStrike';
export type GameId = PCGameId | MobileGameId;

export type FingerSetup =
  | '2-Thumb'
  | '3-Finger Claw'
  | '4-Finger Claw'
  | '5-Finger Claw'
  | '6-Finger Claw';

export type CrosshairColorPreset =
  | 'Cyan'
  | 'Red'
  | 'Green'
  | 'Yellow'
  | 'White'
  | 'Pink'
  | 'Custom Hex';

export type CrosshairBackground = 'Bright Map' | 'Dark Corner' | 'Blue Sky';

export interface CrosshairSettings {
  colorPreset: CrosshairColorPreset;
  customHex: string;
  centerDot: boolean;
  centerDotSize: number;
  centerDotOpacity: number;
  outlines: boolean;
  outlineThickness: number;
  outlineOpacity: number;
  innerLines: boolean;
  innerLength: number;
  innerThickness: number;
  innerOffset: number;
  innerOpacity: number;
  outerLines: boolean;
  outerLength: number;
  outerThickness: number;
  outerOffset: number;
  outerOpacity: number;
}

export interface AimConfig {
  id: string;
  userId: string;
  name: string;
  platform?: PlatformMode;
  game: GameId;
  tags: string;
  // PC FPS Fields
  dpi?: number;
  sensitivity?: number;
  edpi?: number;
  cm360?: number;
  crosshairCode?: string;
  resolution?: string;
  // Mobile FPS Fields
  cameraSens?: number;
  adsSens?: number;
  gyroSens?: number;
  fingerSetup?: FingerSetup;
  hudCode?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AimDrillResult {
  score: number;
  hits: number;
  shots: number;
  accuracy: number;
  avgReactionMs: number;
  hitsPerSec: number;
  bestStreak: number;
}

export interface TrackingDrillResult {
  timeOnTargetPct: number;
  longestStreakSec: number;
  totalOnTargetSec: number;
  targetType: 'ball' | 'human';
}
