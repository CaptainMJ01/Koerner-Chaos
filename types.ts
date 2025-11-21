
export enum GameState {
  MENU = 'MENU',
  LEAD_CAPTURE = 'LEAD_CAPTURE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  RESULTS = 'RESULTS'
}

export enum PowerUpType {
  DELEGATE = 'DELEGATE',
  SYSTEMISE = 'SYSTEMISE',
  FOCUS_MODE = 'FOCUS_MODE',
  AI_ASSIST = 'AI_ASSIST'
}

export interface FallingItemConfig {
  id: string;
  name: string;
  label: string;
  icon: string; // Emoji or character for now
  color: string;
  points: number;
  type: 'IDEA' | 'DISTRACTION' | 'POWERUP';
  powerUpType?: PowerUpType;
}

export interface ActiveItem extends FallingItemConfig {
  uid: string;
  x: number;
  y: number;
  speed: number;
}

export interface PlayerProfile {
  category: 'Operator' | 'Builder' | 'Strategist' | 'Visionary';
  insight: string;
  cta: string;
  shareText: string;
}

export interface LeadInfo {
  name: string;
  email: string;
  role?: string;
}

export interface HighScoreEntry {
  name: string;
  score: number;
}