import { PowerUpType } from './types.js';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const PLAYER_WIDTH = 64;
export const PLAYER_HEIGHT = 64;
export const ITEM_SIZE = 40;
export const HIGH_SCORE_KEY = 'koerner_chaos_highscores';
export const GAME_URL = 'https://leadarcade.com/koerner-chaos'; 

export const ASSET_PROMPTS = {
  chris: "16-bit pixel art character, male, short brown hair, glasses, orange polo shirt, black jeans. Three poses: Idle (standing confident), Run (arms pumping), Catch (hands up).",
  background: "16-bit arcade background, dark retro office skyline at night, neon grid floor, distant city lights in purple and teal.",
  christmasBackground: "A pixel art winter shop interior inspired by decorated tech stores. Retro Christmas lights in warm colors, garland, ornaments, and small pixel trees. Snow visible through a shop window. Holiday themed versions of store items. A clean central vertical space for gameplay elements. Authentic 16 bit pixel art style with a limited palette and high contrast lighting.",
  items: "16-bit icons: Cloud with gear (SaaS), Robot head (Automation), Checklist (Systems), Beaker (Experiment), House key (Real Estate), Lightbulb (Inspiration).",
  sounds: {
    catch: "Short 8-bit coin collect sound (high pitch)",
    drop: "Low pitched thud or buzz",
    powerup: "Ascending major arpeggio",
    gameover: "Descending slide whistle followed by a crash"
  }
};

export const FALLING_ITEMS = [
  { id: 'saas', name: 'SaaS Idea', label: 'SaaS', icon: '☁️', color: 'text-blue-400', points: 100, type: 'IDEA' },
  { id: 'auto', name: 'Automation', label: 'Auto', icon: '🤖', color: 'text-purple-400', points: 150, type: 'IDEA' },
  { id: 'system', name: 'System Task', label: 'Sys', icon: '📋', color: 'text-gray-400', points: 50, type: 'IDEA' },
  { id: 'market', name: 'Experiment', label: 'Exp', icon: '🧪', color: 'text-green-400', points: 200, type: 'IDEA' },
  { id: 'estate', name: 'Real Estate', label: 'Prop', icon: '🏠', color: 'text-yellow-400', points: 300, type: 'IDEA' },
  { id: 'content', name: 'Inspiration', label: 'Idea', icon: '💡', color: 'text-yellow-200', points: 75, type: 'IDEA' },
  // Distractions
  { id: 'spam', name: 'Spam Email', label: 'Spam', icon: '📧', color: 'text-red-500', points: 0, type: 'DISTRACTION' },
  { id: 'meeting', name: 'Useless Mtg', label: 'Mtg', icon: '👔', color: 'text-red-500', points: 0, type: 'DISTRACTION' },
  { id: 'notification', name: 'Distracting Notification', label: 'Ping', icon: '🔔', color: 'text-pink-500', points: 0, type: 'DISTRACTION' },
  { id: 'urgent', name: 'Urgent Unrelated Task', label: 'Fire', icon: '🔥', color: 'text-orange-600', points: 0, type: 'DISTRACTION' },
];

export const POWER_UPS = [
  { id: 'p_delegate', name: 'Delegate', label: 'DEL', icon: '🤝', color: 'text-white bg-blue-600', points: 0, type: 'POWERUP', powerUpType: PowerUpType.DELEGATE },
  { id: 'p_system', name: 'Systemise', label: 'SYS', icon: '⚙️', color: 'text-white bg-gray-600', points: 0, type: 'POWERUP', powerUpType: PowerUpType.SYSTEMISE },
  { id: 'p_focus', name: 'Focus Mode', label: 'FOC', icon: '🎯', color: 'text-white bg-red-600', points: 0, type: 'POWERUP', powerUpType: PowerUpType.FOCUS_MODE },
  { id: 'p_ai', name: 'AI Assist', label: 'AI', icon: '✨', color: 'text-white bg-purple-600', points: 0, type: 'POWERUP', powerUpType: PowerUpType.AI_ASSIST },
  // Christmas Trigger Item
  { id: 'p_xmas', name: 'Holiday Spirit', label: 'XMAS', icon: '🎄', color: 'text-white bg-green-600', points: 0, type: 'POWERUP', powerUpType: 'CHRISTMAS_TRIGGER' },
];

export const PROFILES = {
  OPERATOR: {
    category: 'Operator',
    insight: "You're reliable and get things done, but you might be trading time for money. It's time to scale yourself out of the equation.",
    cta: "Learn how to automate your daily grind.",
    shareText: "I scored {score} in Koerner Chaos! I'm a reliable Operator. Can you beat me?"
  },
  BUILDER: {
    category: 'Builder',
    insight: "You love creating new things, but maintenance is killing your momentum. You need better systems to support your creations.",
    cta: "Get the blueprint for sustainable growth.",
    shareText: "I scored {score} in Koerner Chaos! I'm a prolific Builder. Check out my empire!"
  },
  STRATEGIST: {
    category: 'Strategist',
    insight: "You see the big picture and manage resources well. Your next step is leveraging leverage—capital, code, and media.",
    cta: "Master the art of high-leverage systems.",
    shareText: "I scored {score} in Koerner Chaos! I'm a Strategist. I play the long game."
  },
  VISIONARY: {
    category: 'Visionary',
    insight: "You're generating ideas faster than you can execute. You need a team and an AI-powered infrastructure to catch them all.",
    cta: "Join the Lead Arcade inner circle.",
    shareText: "I scored {score} in Koerner Chaos! I'm a Visionary. The future is pixelated."
  }
};

export const UI_COPY = {
  start: {
    title: "KOERNER CHAOS",
    subtitle: "Can you manage the empire?",
    cta: "START GAME"
  },
  instructions: "Press LEFT/RIGHT ARROWS (or DRAG) to move. Catch IDEAS (💡). Miss an IDEA or hit a DISTRACTION (🔔) and you lose a heart (❤️)!",
  leadCapture: {
    title: "Before we begin...",
    body: "Chris wants to know who's stepping into the arcade. Sign up for the Lead Arcade Newsletter to unlock the leaderboard and exclusive rewards.",
    rewardText: "Reward: 'The 7-Figure Systems Checklist' (PDF)"
  },
  gameover: {
    title: "GAME OVER",
    subtitle: "You ran out of lives! Too many ideas slipped away.",
    cta: "VIEW RESULTS"
  }
};