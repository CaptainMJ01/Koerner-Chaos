
import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { GAME_WIDTH, GAME_HEIGHT, FALLING_ITEMS, PLAYER_WIDTH, PLAYER_HEIGHT, ITEM_SIZE, POWER_UPS } from '../constants';
import { ActiveItem, PowerUpType } from '../types';
import { ChrisSprite, ChrisPose } from './ChrisSprite';
import { Button } from './Button';

interface GameEngineProps {
  onGameOver: (score: number) => void;
  onRestart: () => void;
}

interface CatchEffect {
  id: string;
  x: number;
  y: number;
  icon: string;
  color: string;
  label: string;
  startTime: number;
}

export const GameEngine: React.FC<GameEngineProps> = ({ onGameOver, onRestart }) => {
  // Game State Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const maxScoreRef = useRef(0); 
  const livesRef = useRef(3);
  const itemsRef = useRef<ActiveItem[]>([]);
  const catchEffectsRef = useRef<CatchEffect[]>([]);
  const playerXRef = useRef(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  
  // Audio Context Ref
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Music Scheduling Refs
  const nextNoteTimeRef = useRef(0);
  const schedulerTimerRef = useRef<number | null>(null);
  const currentNoteIndexRef = useRef(0);
  
  // Time Refs
  const startTimeRef = useRef<number>(0);
  const gameTime = useRef(0);
  const lastDropTime = useRef(0);
  const pauseStartTimeRef = useRef(0);
  
  // Input State Refs
  const keysPressed = useRef<Set<string>>(new Set());
  const touchDirection = useRef<'LEFT' | 'RIGHT' | null>(null); 
  
  // Animation Refs
  const facingRightRef = useRef(true);
  const catchTimerRef = useRef(0);
  
  // Spawn Logic Refs
  const isFirstSpawnRef = useRef(true);
  const isChristmasThemeRef = useRef(false);

  // Power-up states
  const powerUpActive = useRef<PowerUpType | null>(null);
  const powerUpTimer = useRef(0);

  // React State for UI rendering
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [overlayText, setOverlayText] = useState<string | null>(null);
  const [damageFlash, setDamageFlash] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isChristmasTheme, setIsChristmasTheme] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  
  // Mute Ref for Loop
  const isMutedRef = useRef(isMuted);
  
  // Sprite State for rendering
  const [playerPose, setPlayerPose] = useState<ChrisPose>('IDLE');
  const [facingRight, setFacingRight] = useState(true);
  
  // Frame tick to force render updates
  const [, setTick] = useState(0);

  // Update refs when state changes
  useEffect(() => {
      isChristmasThemeRef.current = isChristmasTheme;
  }, [isChristmasTheme]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    if (isMuted) {
        stopMusic();
    } else if (!isPaused && livesRef.current > 0) {
        startMusic();
    }
  }, [isMuted, isPaused]);

  // Handle Responsive Scaling
  useLayoutEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const { width } = canvasRef.current.getBoundingClientRect();
        const scale = width / GAME_WIDTH;
        setScaleFactor(scale);
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // --- AUDIO SYSTEM ---

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
    return audioContextRef.current;
  };

  // Procedural Music Engine
  const startMusic = () => {
    if (isMutedRef.current || isPaused || livesRef.current <= 0) return;
    
    const ctx = initAudioContext();
    if (!ctx) return;

    // Reset scheduling if starting fresh
    if (schedulerTimerRef.current === null) {
        nextNoteTimeRef.current = ctx.currentTime + 0.1;
        currentNoteIndexRef.current = 0;
        scheduleMusic();
    }
  };

  const stopMusic = () => {
    if (schedulerTimerRef.current) {
        window.clearTimeout(schedulerTimerRef.current);
        schedulerTimerRef.current = null;
    }
  };

  const scheduleMusic = () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Lookahead: Schedule notes for the next 0.1s
    const lookahead = 0.1; 
    const scheduleAheadTime = 0.1;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
        playMusicNote(nextNoteTimeRef.current, currentNoteIndexRef.current);
        
        // Advance time: 16th notes at 140 BPM
        // 60 / 140 = 0.428s per beat. 16th note = beat / 4 = 0.107s
        const secondsPerBeat = 60.0 / 140.0;
        const sixteenthNoteTime = secondsPerBeat * 0.25;
        
        nextNoteTimeRef.current += sixteenthNoteTime;
        currentNoteIndexRef.current++;
    }

    // Loop the scheduler
    schedulerTimerRef.current = window.setTimeout(scheduleMusic, lookahead * 1000);
  };

  const playMusicNote = (time: number, noteIndex: number) => {
    if (isMutedRef.current) return;
    const ctx = audioContextRef.current!;

    // Chord Progression: Am - F - C - G (Arpeggiated)
    // 16 steps per bar. 4 bars loop.
    const measure = Math.floor(noteIndex / 16) % 4;
    const step = noteIndex % 16;

    // Bass Frequencies
    const chords = [
        { root: 110, notes: [220, 261, 329] }, // A2 -> Am (A, C, E)
        { root: 87,  notes: [174, 220, 261] }, // F2 -> F  (F, A, C)
        { root: 130, notes: [261, 329, 392] }, // C3 -> C  (C, E, G)
        { root: 98,  notes: [196, 246, 293] }, // G2 -> G  (G, B, D)
    ];

    const currentChord = chords[measure];

    // 1. Bass Line (On beat)
    if (step % 4 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = isChristmasTheme ? 'sine' : 'triangle'; 
        osc.frequency.setValueAtTime(currentChord.root, time);
        
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.3);
    }

    // 2. Melody / Arpeggio (Constant 16th notes)
    // Pattern: Root - Mid - High - Mid
    const notePattern = [0, 1, 2, 1]; 
    const noteFreq = currentChord.notes[notePattern[step % 4]];

    const oscLead = ctx.createOscillator();
    const gainLead = ctx.createGain();
    oscLead.type = isChristmasTheme ? 'sine' : 'square'; 
    oscLead.frequency.setValueAtTime(noteFreq * (isChristmasTheme ? 2 : 1), time); 
    
    // Short pluck envelope
    gainLead.gain.setValueAtTime(0.03, time); 
    gainLead.gain.exponentialRampToValueAtTime(0.001, time + (isChristmasTheme ? 0.3 : 0.1)); 
    
    oscLead.connect(gainLead);
    gainLead.connect(ctx.destination);
    oscLead.start(time);
    oscLead.stop(time + (isChristmasTheme ? 0.3 : 0.1));

    // 3. Percussion (Hi-hats)
    if (step % 2 !== 0) {
        const bufferSize = ctx.sampleRate * 0.05; // 50ms noise
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        
        const volume = (step % 4 === 2) ? 0.03 : 0.01;
        noiseGain.gain.setValueAtTime(volume, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(time);
    }
  };

  const playRetroSound = (type: 'catch' | 'damage' | 'powerup' | 'gameover' | 'jingle') => {
    if (isMutedRef.current) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'catch': 
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'damage': 
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'powerup':
        osc.type = 'square';
        osc.start(now);
        osc.stop(now + 0.4);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1);
        osc.frequency.setValueAtTime(659, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        break;
      case 'jingle': 
        osc.type = 'sine';
        osc.start(now);
        osc.stop(now + 0.5);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.frequency.setValueAtTime(1046.50, now); // C6
        setTimeout(() => {
             if(audioContextRef.current) {
                const o2 = audioContextRef.current.createOscillator();
                const g2 = audioContextRef.current.createGain();
                o2.type = 'sine';
                o2.connect(g2);
                g2.connect(audioContextRef.current.destination);
                o2.frequency.value = 1318.51; // E6
                g2.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
                g2.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.4);
                o2.start();
                o2.stop(audioContextRef.current.currentTime + 0.4);
             }
        }, 100);
        break;
      case 'gameover': 
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.8);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        
         if(audioContextRef.current) {
            const bufferSize = audioContextRef.current.sampleRate * 0.5;
            const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = audioContextRef.current.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = audioContextRef.current.createGain();
            noiseGain.gain.setValueAtTime(0.2, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            noise.connect(noiseGain);
            noiseGain.connect(audioContextRef.current.destination);
            noise.start(now);
         }
        break;
    }
  };

  const getDifficulty = (currentScore: number) => {
    const safeScore = Math.max(0, currentScore);
    const level = Math.floor(safeScore / 100) + 1; 
    const speedMultiplier = Math.min(3.0, 0.7 + ((level - 1) * 0.05));
    
    return {
      dropInterval: Math.max(350, 2000 - ((level - 1) * 40)), 
      speedMultiplier: speedMultiplier,
      maxItems: Math.min(15, 3 + Math.floor(level / 2)) 
    };
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }
    keysPressed.current.add(e.key);
    initAudioContext();
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current.delete(e.key);
  }, []);

  const handleTouchStart = (direction: 'LEFT' | 'RIGHT') => (e: React.TouchEvent) => {
    touchDirection.current = direction;
    initAudioContext(); // Init audio on touch
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchDirection.current = null;
  };

  const togglePause = () => {
    setIsPaused(prev => {
      const nextPaused = !prev;
      
      if (nextPaused) {
        stopMusic(); // Stop music on pause
        pauseStartTimeRef.current = performance.now();
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      } else {
        startMusic(); // Resume music
        const now = performance.now();
        const pauseDuration = now - pauseStartTimeRef.current;
        
        gameTime.current += pauseDuration;
        lastDropTime.current += pauseDuration;
        catchTimerRef.current += pauseDuration;
        powerUpTimer.current += pauseDuration;
        
        catchEffectsRef.current.forEach(effect => {
            effect.startTime += pauseDuration;
        });

        requestRef.current = requestAnimationFrame(update);
      }
      
      return nextPaused;
    });
  };

  const toggleChristmasTheme = () => {
      setIsChristmasTheme(prev => {
          const newState = !prev;
          if (newState) {
              playRetroSound('jingle');
              setOverlayText("HO HO HO!");
              setTimeout(() => setOverlayText(null), 2000);
          }
          return newState;
      });
  };

  const handleQuit = () => {
    stopMusic();
    onGameOver(scoreRef.current);
  };

  const processTouchPos = (clientX: number) => {
    if (isPaused || touchDirection.current !== null) return; 
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const relativeX = clientX - rect.left;
      const gameScale = GAME_WIDTH / rect.width; 
      const newX = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, (relativeX * gameScale) - (PLAYER_WIDTH / 2)));
      
      if (newX > playerXRef.current) facingRightRef.current = true;
      if (newX < playerXRef.current) facingRightRef.current = false;
      
      playerXRef.current = newX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    processTouchPos(e.touches[0].clientX);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    initAudioContext(); // Init audio on canvas touch
    processTouchPos(e.touches[0].clientX);
  };

  const spawnItem = (difficulty: any) => {
    let template;
    let xPos;
    let yPos = -ITEM_SIZE;
    
    if (isFirstSpawnRef.current) {
        template = FALLING_ITEMS.find(i => i.id === 'saas') || FALLING_ITEMS[0];
        xPos = (GAME_WIDTH - ITEM_SIZE) / 2;
        yPos = 80; 
        isFirstSpawnRef.current = false;
    } else {
        const isPowerUp = Math.random() < 0.05;
        let pool;
        if (isPowerUp) {
            // If Christmas theme is NOT active, include the tree trigger
            const availablePowerUps = [...POWER_UPS];
            // The Christmas trigger logic:
            const p_xmas = availablePowerUps.find(p => p.id === 'p_xmas');
            // If we have the item in constants, we filter based on theme
            
            pool = availablePowerUps.filter(p => {
                if (p.powerUpType === PowerUpType.SYSTEMISE) {
                    return maxScoreRef.current >= 1000;
                }
                // Only show Christmas trigger if NOT in Christmas theme
                if (p.id === 'p_xmas') {
                    return !isChristmasThemeRef.current;
                }
                return true;
            });
            
            if (pool.length === 0) pool = FALLING_ITEMS;
        } else {
            pool = FALLING_ITEMS;
        }
        template = pool[Math.floor(Math.random() * pool.length)];
        xPos = Math.random() * (GAME_WIDTH - ITEM_SIZE);
    }

    const consistentSpeed = 2.5 * difficulty.speedMultiplier;

    itemsRef.current.push({
      ...template,
      uid: Math.random().toString(36).substr(2, 9),
      x: xPos,
      y: yPos,
      speed: consistentSpeed
    });
  };

  const activatePowerUp = (type: PowerUpType) => {
    powerUpActive.current = type;
    setActivePowerUp(type);
    powerUpTimer.current = Date.now() + 5000; 

    if (type === PowerUpType.DELEGATE) {
      livesRef.current = Math.min(3, livesRef.current + 1);
      setOverlayText("LIFE RESTORED!");
    } else if (type === PowerUpType.SYSTEMISE) {
      setOverlayText("SLOW MOTION!");
    } else if (type === PowerUpType.FOCUS_MODE) {
      setOverlayText("2X POINTS!");
    } else if (type === PowerUpType.AI_ASSIST) {
      setOverlayText("AI ASSIST ACTIVE!");
    } else if (type === 'CHRISTMAS_TRIGGER' as PowerUpType) {
        // Force enable christmas theme
        setIsChristmasTheme(true);
        setOverlayText("MERRY CHRISTMAS!");
        playRetroSound('jingle');
        // Does not expire in the traditional sense, theme stays on
        powerUpTimer.current = Date.now(); // clear active state immediately for UI
        setActivePowerUp(null);
        return;
    }

    setTimeout(() => setOverlayText(null), 1500);
  };

  const triggerDamage = () => {
     setDamageFlash(true);
     setTimeout(() => setDamageFlash(false), 200);
  };

  const update = (time: number) => {
    if (startTimeRef.current === 0) {
        startTimeRef.current = time;
    }
    
    const deltaTime = time - gameTime.current; 
    gameTime.current = time;

    const difficulty = getDifficulty(maxScoreRef.current);
    const baseSpeed = 2.5; 
    let globalSpeed = baseSpeed * difficulty.speedMultiplier;

    if (powerUpActive.current === PowerUpType.SYSTEMISE) {
        globalSpeed *= 0.5;
    }

    const moveSpeed = 8 * (deltaTime / 16); 
    let isMoving = false;

    if (keysPressed.current.has('ArrowLeft') || touchDirection.current === 'LEFT') {
      playerXRef.current = Math.max(0, playerXRef.current - moveSpeed);
      facingRightRef.current = false;
      isMoving = true;
    }
    if (keysPressed.current.has('ArrowRight') || touchDirection.current === 'RIGHT') {
      playerXRef.current = Math.min(GAME_WIDTH - PLAYER_WIDTH, playerXRef.current + moveSpeed);
      facingRightRef.current = true;
      isMoving = true;
    }

    if (time - lastDropTime.current > difficulty.dropInterval) {
      if (itemsRef.current.length < difficulty.maxItems) {
        spawnItem(difficulty);
        lastDropTime.current = time;
      }
    }

    if (powerUpActive.current && Date.now() > powerUpTimer.current) {
      powerUpActive.current = null;
      setActivePowerUp(null);
    }

    const newItems: ActiveItem[] = [];
    let caughtItemThisFrame = false;

    itemsRef.current.forEach(item => {
      item.y += globalSpeed;

      const playerHitBoxWidth = powerUpActive.current === PowerUpType.AI_ASSIST ? PLAYER_WIDTH * 2 : PLAYER_WIDTH;
      const playerHitBoxX = powerUpActive.current === PowerUpType.AI_ASSIST ? playerXRef.current - (PLAYER_WIDTH/2) : playerXRef.current;

      const caught = 
        item.y + ITEM_SIZE >= GAME_HEIGHT - PLAYER_HEIGHT &&
        item.y <= GAME_HEIGHT &&
        item.x + ITEM_SIZE >= playerHitBoxX &&
        item.x <= playerHitBoxX + playerHitBoxWidth;

      if (caught) {
        caughtItemThisFrame = true;
        if (item.type === 'POWERUP' && item.powerUpType) {
          activatePowerUp(item.powerUpType);
          playRetroSound('powerup');
        } else if (item.type === 'DISTRACTION') {
            livesRef.current -= 1;
            triggerDamage();
            playRetroSound('damage');
            
            catchEffectsRef.current.push({
                id: Math.random().toString(36).substr(2, 9),
                x: item.x,
                y: item.y,
                icon: item.icon,
                color: 'text-red-600',
                label: '-1 ❤️',
                startTime: Date.now()
            });
        } else {
          const multiplier = (powerUpActive.current === PowerUpType.FOCUS_MODE && item.points > 0) ? 2 : 1;
          const points = item.points * multiplier;
          
          scoreRef.current = Math.max(0, scoreRef.current + points);
          maxScoreRef.current = Math.max(maxScoreRef.current, scoreRef.current);
          
          playRetroSound('catch');

          catchEffectsRef.current.push({
            id: Math.random().toString(36).substr(2, 9),
            x: item.x,
            y: item.y,
            icon: item.icon,
            color: item.color,
            label: `+${points}`,
            startTime: Date.now()
          });
        }
      } else if (item.y > GAME_HEIGHT) {
        if (item.type === 'IDEA') {
          livesRef.current -= 1;
          triggerDamage();
          playRetroSound('damage');
          
           catchEffectsRef.current.push({
            id: Math.random().toString(36).substr(2, 9),
            x: item.x,
            y: GAME_HEIGHT - 50,
            icon: '💔',
            color: 'text-red-600',
            label: 'MISSED!',
            startTime: Date.now()
          });
        }
      } else {
        newItems.push(item);
      }
    });

    itemsRef.current = newItems;

    const now = Date.now();
    catchEffectsRef.current = catchEffectsRef.current.filter(effect => now - effect.startTime < 600);

    if (caughtItemThisFrame) {
      catchTimerRef.current = Date.now() + 300; 
    }

    let currentPose: ChrisPose = 'IDLE';
    if (Date.now() < catchTimerRef.current) {
      currentPose = 'CATCH';
    } else if (isMoving) {
      currentPose = 'RUN';
    }

    setScore(scoreRef.current);
    setLives(livesRef.current);
    setPlayerPose(currentPose);
    setFacingRight(facingRightRef.current);
    setTick(t => t + 1); 

    if (livesRef.current <= 0) {
      stopMusic(); // Stop music on game over
      playRetroSound('gameover');
      onGameOver(scoreRef.current);
      return;
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    if (!isPaused) {
        startMusic();
        requestRef.current = requestAnimationFrame(update);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stopMusic(); 
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleKeyDown, handleKeyUp]); 
  
  const ElfSprite = ({x, y, reverse = false}: {x: number, y: number, reverse?: boolean}) => (
    <div className="absolute z-0" style={{
        left: x, top: y,
        width: '24px', height: '32px',
        transform: reverse ? 'scaleX(-1)' : 'none',
        animation: reverse ? 'elf-patrol-reverse 10s infinite linear' : 'elf-walk 8s infinite linear'
    }}>
        {/* Hat */}
        <div className="absolute top-0 left-[8px] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-green-600"></div>
        <div className="absolute top-[6px] left-[6px] w-[12px] h-[2px] bg-white"></div>
        {/* Face */}
        <div className="absolute top-[8px] left-[6px] w-[12px] h-[8px] bg-[#FFDCB1]"></div>
        <div className="absolute top-[10px] left-[8px] w-[2px] h-[2px] bg-black"></div>
        <div className="absolute top-[10px] right-[8px] w-[2px] h-[2px] bg-black"></div>
        {/* Body */}
        <div className="absolute top-[16px] left-[4px] w-[16px] h-[10px] bg-green-600"></div>
        <div className="absolute top-[16px] left-[10px] w-[4px] h-[10px] bg-white/20"></div>
        <div className="absolute top-[20px] left-[2px] w-[20px] h-[2px] bg-black"></div>
        {/* Legs */}
        <div className="absolute top-[26px] left-[6px] w-[4px] h-[6px] bg-red-500"></div>
        <div className="absolute top-[26px] right-[6px] w-[4px] h-[6px] bg-white"></div>
    </div>
  );

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden select-none touch-none flex items-center justify-center" 
         ref={canvasRef}
         onTouchMove={handleTouchMove}
         onTouchStart={handleCanvasTouchStart}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spider-crawl {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -10px) rotate(10deg); }
          50% { transform: translate(40px, 0) rotate(0deg); }
          75% { transform: translate(20px, 10px) rotate(-10deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes snow-fall {
          0% { transform: translateY(-10px); }
          100% { transform: translateY(100px); }
        }
        @keyframes snow-fall-fast {
          0% { transform: translateY(-20px); }
          100% { transform: translateY(200px); }
        }
        @keyframes elf-walk {
            0% { transform: translateX(0); }
            50% { transform: translateX(100px); }
            50.1% { transform: translateX(100px) scaleX(-1); }
            100% { transform: translateX(0) scaleX(-1); }
        }
        @keyframes elf-patrol-reverse {
            0% { transform: translateX(0) scaleX(-1); }
            50% { transform: translateX(-80px) scaleX(-1); }
            50.1% { transform: translateX(-80px); }
            100% { transform: translateX(0); }
        }
        @keyframes bulb-flash {
            0%, 100% { opacity: 1; filter: brightness(1.2); }
            50% { opacity: 0.5; filter: brightness(0.8); }
        }
      `}} />

      <div className="absolute inset-0 flex items-center justify-center md:hidden pointer-events-none opacity-30 z-0">
         <span className="text-xs text-gray-500">ROTATE FOR BEST EXPERIENCE</span>
      </div>

      <div style={{
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        transform: `scale(${scaleFactor})`,
        transformOrigin: 'center', 
        position: 'relative',
        backgroundColor: isChristmasTheme ? '#0f172a' : '#0f172a' 
      }}>

      {damageFlash && (
        <div className="absolute inset-0 bg-red-500 opacity-30 z-40 pointer-events-none" />
      )}

      {/* --- BACKGROUND SWITCH --- */}
      {!isChristmasTheme ? (
        // STANDARD PHONE REPAIR SHOP
        <>
            <div className="absolute inset-0 z-0" style={{
                background: 'linear-gradient(to bottom, #020617 0%, #1e1b4b 100%)'
            }}></div>

            <div className="absolute top-[-50px] left-[-100px] w-[600px] h-[300px] border-b-[3px] border-gray-800 rounded-[100%] z-0 pointer-events-none opacity-60"></div>
            <div className="absolute top-[-20px] right-[-50px] w-[500px] h-[250px] border-b-[3px] border-gray-800 rounded-[100%] z-0 pointer-events-none opacity-60"></div>
            <div className="absolute top-[60px] left-[200px] w-[400px] h-[100px] border-b-[2px] border-black rounded-[100%] z-0 pointer-events-none opacity-40"></div>

            <div className="absolute top-0 bottom-[100px] left-0 w-[200px] z-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
                backgroundSize: '10px 10px'
            }}></div>
            <div className="absolute top-0 bottom-[100px] right-0 w-[200px] z-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
                backgroundSize: '10px 10px'
            }}></div>

            <div className="absolute left-4 top-[120px] w-[140px] h-[6px] bg-slate-800 border-b border-slate-600 shadow-md z-0"></div>
            <div className="absolute left-4 top-[240px] w-[140px] h-[6px] bg-slate-800 border-b border-slate-600 shadow-md z-0"></div>
            <div className="absolute left-4 top-[360px] w-[140px] h-[6px] bg-slate-800 border-b border-slate-600 shadow-md z-0"></div>
            
            <div className="absolute left-6 top-[90px] flex gap-2 z-0">
                <div className="w-6 h-8 bg-blue-800 border border-blue-600"></div>
                <div className="w-8 h-8 bg-purple-900 border border-purple-600"></div>
                <div className="w-6 h-8 bg-gray-700 border border-gray-500"></div>
            </div>
            <div className="absolute left-8 top-[210px] flex gap-1 z-0">
                <div className="w-4 h-8 bg-red-800"></div>
                <div className="w-4 h-8 bg-green-800"></div>
                <div className="w-4 h-8 bg-yellow-800"></div>
                <div className="w-4 h-8 bg-blue-800"></div>
                <div className="absolute left-20 bottom-0 w-5 h-10 bg-gray-400 border border-gray-600 rounded-sm flex flex-col items-center pt-1">
                    <div className="w-3 h-3 bg-green-900/80 border border-green-700/50"></div>
                    <div className="grid grid-cols-3 gap-[1px] mt-1">
                        {[...Array(9)].map((_,i) => <div key={i} className="w-[1px] h-[1px] bg-black"></div>)}
                    </div>
                    <div className="absolute -top-3 left-1 w-[2px] h-3 bg-black"></div>
                </div>
            </div>
            <div className="absolute left-6 top-[320px] flex gap-3 z-0">
                <div className="w-16 h-10 bg-gray-400 border-b-4 border-gray-600 rounded-sm"></div>
                <div className="w-10 h-10 bg-black border border-gray-600"></div>
            </div>

            <div className="absolute right-4 top-[120px] w-[140px] h-[6px] bg-slate-800 border-b border-slate-600 shadow-md z-0"></div>
            <div className="absolute right-4 top-[240px] w-[140px] h-[6px] bg-slate-800 border-b border-slate-600 shadow-md z-0"></div>
            <div className="absolute right-4 top-[360px] w-[140px] h-[6px] bg-slate-800 border-b border-slate-600 shadow-md z-0"></div>

            <div className="absolute right-8 top-[95px] flex gap-2 z-0">
                <div className="w-5 h-7 bg-gray-300 border border-gray-500 rounded-[1px]"></div> 
                <div className="w-5 h-7 bg-black border border-gray-600 rounded-[1px]"></div>
                <div className="w-5 h-7 bg-white border border-gray-400 rounded-[1px]"></div>
                <div className="w-5 h-7 bg-pink-400 border border-pink-600 rounded-[1px]"></div>
            </div>
            <div className="absolute right-6 top-[200px] flex gap-2 z-0 items-end">
                <div className="w-10 h-10 bg-blue-600 border-2 border-blue-400"></div> 
                <div className="w-12 h-8 bg-gray-800 border-2 border-gray-600"></div>
            </div>
            <div className="absolute right-6 top-[330px] flex gap-2 z-0 items-end">
                <div className="w-full h-[30px] border-t-2 border-dashed border-gray-500 opacity-50"></div>
            </div>

            <div className="absolute left-[180px] top-[80px] w-[50px] h-[70px] bg-yellow-900/50 border border-yellow-600 rotate-[-2deg] z-0"></div>
            <div className="absolute right-[180px] top-[100px] w-[40px] h-[60px] bg-green-900/50 border border-green-600 rotate-[3deg] z-0"></div>

            <div className="absolute left-[40%] top-[180px] w-4 h-4 z-0 opacity-60" style={{ animation: 'spider-crawl 10s infinite linear' }}>
                <div className="w-2 h-2 bg-black rounded-full relative mx-auto">
                    <div className="absolute -left-1 -top-1 w-4 h-[1px] bg-black rotate-45"></div>
                    <div className="absolute -left-1 top-1 w-4 h-[1px] bg-black -rotate-45"></div>
                    <div className="absolute -left-1 top-0 w-4 h-[1px] bg-black"></div>
                    <div className="absolute left-1 -top-2 w-[1px] h-4 bg-black rotate-12"></div>
                    <div className="absolute left-[3px] -top-[100px] h-[100px] w-[1px] bg-white/10"></div>
                </div>
            </div>

            <div className="absolute z-0 top-[40px] left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="border-4 border-pink-500/30 bg-black/60 px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(236,72,153,0.2)] backdrop-blur-sm">
                <h1 className="text-4xl md:text-5xl font-bold text-pink-400 tracking-[0.15em] font-mono" 
                    style={{ textShadow: '0 0 5px #ec4899, 0 0 10px #ec4899, 0 0 20px #be185d' }}>
                    PHONE RESTORE
                </h1>
                </div>
                <div className="w-[2px] h-[500px] bg-black/50 absolute -top-[500px] left-1/4"></div>
                <div className="w-[2px] h-[500px] bg-black/50 absolute -top-[500px] right-1/4"></div>
            </div>
        </>
      ) : (
        // CHRISTMAS THEME BACKGROUND
        <>
            {/* Winter Night Gradient */}
            <div className="absolute inset-0 z-0" style={{
                background: 'linear-gradient(to bottom, #0f172a 0%, #334155 100%)'
            }}></div>

            {/* Perimeter Vertical Lights */}
            <div className="absolute top-0 bottom-0 left-0 w-[10px] z-0 flex flex-col gap-4 items-center py-2 border-r border-white/10">
                 {[...Array(20)].map((_,i) => (
                     <div key={i} className={`w-2 h-2 rounded-full animate-pulse ${['bg-red-500','bg-green-500','bg-blue-500','bg-yellow-400'][i%4]} shadow-[0_0_5px_currentColor]`} style={{animationDelay: `${i*0.1}s`}}></div>
                 ))}
            </div>
            <div className="absolute top-0 bottom-0 right-0 w-[10px] z-0 flex flex-col gap-4 items-center py-2 border-l border-white/10">
                 {[...Array(20)].map((_,i) => (
                     <div key={i} className={`w-2 h-2 rounded-full animate-pulse ${['bg-blue-500','bg-yellow-400','bg-red-500','bg-green-500'][i%4]} shadow-[0_0_5px_currentColor]`} style={{animationDelay: `${i*0.1}s`}}></div>
                 ))}
            </div>

            {/* Snow Window Effect - Background */}
             <div className="absolute top-[20px] left-[180px] right-[180px] h-[150px] bg-blue-900/30 border-4 border-yellow-600/50 rounded-lg z-0 overflow-hidden">
                 {/* Window Frame Lights */}
                 <div className="absolute inset-0 border-[2px] border-dashed border-white/30 opacity-50 flex justify-around items-start pt-1">
                     {[...Array(12)].map((_,i) => <div key={i} className="w-1 h-1 bg-white rounded-full animate-pulse"></div>)}
                 </div>
                 
                 <div className="absolute inset-0 opacity-50" style={{
                     backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                     backgroundSize: '20px 20px',
                     animation: 'snow-fall 5s linear infinite'
                 }}></div>
                 <div className="absolute inset-0 opacity-30" style={{
                     backgroundImage: 'radial-gradient(white 2px, transparent 2px)',
                     backgroundSize: '35px 35px',
                     animation: 'snow-fall-fast 7s linear infinite'
                 }}></div>
                 <div className="absolute bottom-0 w-full h-[10px] bg-white/80"></div>
             </div>

            {/* --- PRESERVED SHELF ITEMS (Same as Standard Theme) --- */}
            {/* Left Shelf 1 */}
            <div className="absolute left-6 top-[90px] flex gap-2 z-0">
                <div className="w-6 h-8 bg-blue-800 border border-blue-600"></div>
                <div className="w-8 h-8 bg-purple-900 border border-purple-600"></div>
                <div className="w-6 h-8 bg-gray-700 border border-gray-500"></div>
            </div>
            {/* Left Shelf 2 */}
            <div className="absolute left-8 top-[210px] flex gap-1 z-0">
                <div className="w-4 h-8 bg-red-800"></div>
                <div className="w-4 h-8 bg-green-800"></div>
                <div className="w-4 h-8 bg-yellow-800"></div>
                <div className="w-4 h-8 bg-blue-800"></div>
                <div className="absolute left-20 bottom-0 w-5 h-10 bg-gray-400 border border-gray-600 rounded-sm flex flex-col items-center pt-1">
                    <div className="w-3 h-3 bg-green-900/80 border border-green-700/50"></div>
                    <div className="grid grid-cols-3 gap-[1px] mt-1">
                        {[...Array(9)].map((_,i) => <div key={i} className="w-[1px] h-[1px] bg-black"></div>)}
                    </div>
                    <div className="absolute -top-3 left-1 w-[2px] h-3 bg-black"></div>
                </div>
            </div>
            {/* Left Shelf 3 */}
            <div className="absolute left-6 top-[320px] flex gap-3 z-0">
                <div className="w-16 h-10 bg-gray-400 border-b-4 border-gray-600 rounded-sm"></div>
                <div className="w-10 h-10 bg-black border border-gray-600"></div>
            </div>
             {/* Right Shelf 1 */}
            <div className="absolute right-8 top-[95px] flex gap-2 z-0">
                <div className="w-5 h-7 bg-gray-300 border border-gray-500 rounded-[1px]"></div> 
                <div className="w-5 h-7 bg-black border border-gray-600 rounded-[1px]"></div>
                <div className="w-5 h-7 bg-white border border-gray-400 rounded-[1px]"></div>
                <div className="w-5 h-7 bg-pink-400 border border-pink-600 rounded-[1px]"></div>
            </div>
            {/* Right Shelf 2 */}
            <div className="absolute right-6 top-[200px] flex gap-2 z-0 items-end">
                <div className="w-10 h-10 bg-blue-600 border-2 border-blue-400"></div> 
                <div className="w-12 h-8 bg-gray-800 border-2 border-gray-600"></div>
            </div>
            {/* Right Shelf 3 */}
            <div className="absolute right-6 top-[330px] flex gap-2 z-0 items-end">
                <div className="w-full h-[30px] border-t-2 border-dashed border-gray-500 opacity-50"></div>
            </div>
            {/* Posters */}
            <div className="absolute left-[180px] top-[80px] w-[50px] h-[70px] bg-yellow-900/50 border border-yellow-600 rotate-[-2deg] z-0"></div>
            <div className="absolute right-[180px] top-[100px] w-[40px] h-[60px] bg-green-900/50 border border-green-600 rotate-[3deg] z-0"></div>
             
             {/* Animated Elves - Total 6 */}
             <ElfSprite x={100} y={440} />
             <ElfSprite x={250} y={460} />
             <ElfSprite x={400} y={430} reverse={true} />
             <ElfSprite x={550} y={450} />
             <ElfSprite x={650} y={440} reverse={true} />
             <ElfSprite x={720} y={460} reverse={true} />

             {/* Draping Wall Lights - Connecting Shelves */}
             <div className="absolute top-[120px] left-[144px] right-[144px] h-[40px] z-0 pointer-events-none">
                 <svg width="100%" height="100%" viewBox="0 0 512 40" preserveAspectRatio="none">
                    <path d="M0,0 Q256,40 512,0" fill="none" stroke="#166534" strokeWidth="2" />
                 </svg>
                 <div className="absolute top-[10px] left-[15%] w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_4px_red]" style={{animationName: 'bulb-flash'}}></div>
                 <div className="absolute top-[18px] left-[30%] w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_4px_yellow]" style={{animationName: 'bulb-flash', animationDelay: '0.3s'}}></div>
                 <div className="absolute top-[20px] left-[50%] w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_4px_blue]" style={{animationName: 'bulb-flash', animationDelay: '0.6s'}}></div>
                 <div className="absolute top-[18px] left-[70%] w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_4px_lime]" style={{animationName: 'bulb-flash', animationDelay: '0.2s'}}></div>
                 <div className="absolute top-[10px] left-[85%] w-2 h-2 bg-pink-500 rounded-full animate-pulse shadow-[0_0_4px_pink]" style={{animationName: 'bulb-flash', animationDelay: '0.5s'}}></div>
             </div>

            {/* Shelves with Light Strings */}
            {[120, 240, 360].map((top, i) => (
                <React.Fragment key={i}>
                    {/* Left Shelf */}
                    <div className="absolute left-4 w-[140px] h-[6px] bg-slate-800 border-b border-slate-600 z-0" style={{top}}>
                        <div className="absolute -top-2 w-full h-4 border-t-4 border-green-700 rounded-[50%]"></div>
                        {/* Hanging Icicle Lights */}
                        <div className="absolute top-2 left-4 w-[2px] h-3 bg-white/50 animate-pulse"></div>
                        <div className="absolute top-2 left-10 w-[2px] h-5 bg-white/50 animate-pulse" style={{animationDelay:'0.2s'}}></div>
                        <div className="absolute top-2 left-20 w-[2px] h-3 bg-white/50 animate-pulse" style={{animationDelay:'0.4s'}}></div>
                        <div className="absolute top-2 left-30 w-[2px] h-4 bg-white/50 animate-pulse" style={{animationDelay:'0.1s'}}></div>

                        {/* Bulbs */}
                        <div className="absolute -top-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" style={{animationDelay: `${i * 0.1}s`}}></div>
                        <div className="absolute -top-1 left-8 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: `${i * 0.2}s`}}></div>
                        <div className="absolute -top-2 left-16 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: `${i * 0.3}s`}}></div>
                        <div className="absolute -top-1 left-24 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{animationDelay: `${i * 0.4}s`}}></div>
                        <div className="absolute -top-2 left-32 w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: `${i * 0.5}s`}}></div>
                    </div>
                    {/* Right Shelf */}
                    <div className="absolute right-4 w-[140px] h-[6px] bg-slate-800 border-b border-slate-600 z-0" style={{top}}>
                         <div className="absolute -top-2 w-full h-4 border-t-4 border-green-700 rounded-[50%]"></div>
                         {/* Hanging Icicle Lights */}
                        <div className="absolute top-2 left-4 w-[2px] h-4 bg-white/50 animate-pulse"></div>
                        <div className="absolute top-2 left-12 w-[2px] h-2 bg-white/50 animate-pulse" style={{animationDelay:'0.3s'}}></div>
                        <div className="absolute top-2 left-24 w-[2px] h-5 bg-white/50 animate-pulse" style={{animationDelay:'0.5s'}}></div>

                         {/* Bulbs */}
                        <div className="absolute -top-2 left-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" style={{animationDelay: `${i * 0.1}s`}}></div>
                        <div className="absolute -top-1 left-8 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: `${i * 0.2}s`}}></div>
                        <div className="absolute -top-2 left-16 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: `${i * 0.3}s`}}></div>
                        <div className="absolute -top-1 left-24 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{animationDelay: `${i * 0.4}s`}}></div>
                        <div className="absolute -top-2 left-32 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: `${i * 0.5}s`}}></div>
                    </div>
                </React.Fragment>
            ))}

            {/* LARGE Christmas Tree (4 Layers) */}
            <div className="absolute left-[40px] bottom-[120px] w-0 h-0 border-l-[50px] border-l-transparent border-r-[50px] border-r-transparent border-b-[80px] border-b-green-900 z-0"></div>
            <div className="absolute left-[50px] bottom-[170px] w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[70px] border-b-green-800 z-0"></div>
            <div className="absolute left-[60px] bottom-[220px] w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[50px] border-b-green-700 z-0"></div>
            <div className="absolute left-[70px] bottom-[255px] w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[30px] border-b-green-600 z-0"></div>
            <div className="absolute left-[82px] bottom-[280px] text-yellow-400 text-2xl animate-pulse shadow-[0_0_10px_gold]">★</div>
            
            {/* Tree Ornaments */}
            <div className="absolute left-[85px] bottom-[140px] w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>
            <div className="absolute left-[65px] bottom-[155px] w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-[0_0_5px_blue]" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute left-[110px] bottom-[150px] w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_5px_yellow]" style={{animationDelay: '0.2s'}}></div>
            <div className="absolute left-[90px] bottom-[200px] w-3 h-3 bg-pink-500 rounded-full animate-pulse shadow-[0_0_5px_pink]" style={{animationDelay: '0.7s'}}></div>
            <div className="absolute left-[75px] bottom-[185px] w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_5px_white]" style={{animationDelay: '0.3s'}}></div>
            <div className="absolute left-[100px] bottom-[230px] w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_5px_orange]" style={{animationDelay: '0.4s'}}></div>

            {/* Top Ceiling String Lights - Multiple Drapes */}
            <div className="absolute top-[20px] left-0 right-0 h-[60px] z-0">
                 {/* Cord 1 (Upper) */}
                 <svg width="100%" height="100%" viewBox="0 0 800 60" preserveAspectRatio="none" className="absolute top-0">
                    <path d="M0,0 Q100,30 200,0 T400,0 T600,0 T800,0" fill="none" stroke="#166534" strokeWidth="2" />
                 </svg>
                 {/* Cord 2 (Lower/Denser) */}
                 <svg width="100%" height="100%" viewBox="0 0 800 60" preserveAspectRatio="none" className="absolute top-[10px]">
                    <path d="M50,0 Q150,40 250,0 T450,0 T650,0" fill="none" stroke="#166534" strokeWidth="2" opacity="0.7" />
                 </svg>
                 
                 {/* Bulbs (Upper) */}
                 <div className="absolute top-[15px] left-[50px] w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_red] animate-pulse" style={{animationName: 'bulb-flash'}}></div>
                 <div className="absolute top-[22px] left-[100px] w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_lime] animate-pulse" style={{animationName: 'bulb-flash', animationDelay: '0.2s'}}></div>
                 <div className="absolute top-[15px] left-[150px] w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_5px_blue] animate-pulse" style={{animationName: 'bulb-flash', animationDelay: '0.4s'}}></div>
                 <div className="absolute top-[15px] left-[250px] w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_5px_gold] animate-pulse" style={{animationName: 'bulb-flash', animationDelay: '0.6s'}}></div>
                 <div className="absolute top-[22px] left-[300px] w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_5px_pink] animate-pulse" style={{animationName: 'bulb-flash', animationDelay: '0.1s'}}></div>
                 <div className="absolute top-[15px] left-[450px] w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_red] animate-pulse" style={{animationName: 'bulb-flash', animationDelay: '0.3s'}}></div>
                 <div className="absolute top-[22px] left-[500px] w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_lime] animate-pulse" style={{animationName: 'bulb-flash', animationDelay: '0.5s'}}></div>
                 <div className="absolute top-[15px] left-[650px] w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_5px_blue] animate-pulse" style={{animationName: 'bulb-flash', animationDelay: '0.7s'}}></div>
                 <div className="absolute top-[22px] left-[700px] w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_5px_gold] animate-pulse" style={{animationName: 'bulb-flash', animationDelay: '0.2s'}}></div>

                 {/* Bulbs (Lower) */}
                 <div className="absolute top-[30px] left-[150px] w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_5px_purple] animate-pulse" style={{animationName: 'bulb-flash', animationDelay: '0.8s'}}></div>
                 <div className="absolute top-[30px] left-[350px] w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_5px_cyan] animate-pulse" style={{animationName: 'bulb-flash', animationDelay: '0.9s'}}></div>
                 <div className="absolute top-[30px] left-[550px] w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_5px_orange] animate-pulse" style={{animationName: 'bulb-flash', animationDelay: '0.5s'}}></div>
            </div>
            
            {/* Sign with Holiday Glow */}
            <div className="absolute z-0 top-[40px] left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="border-4 border-red-500/30 bg-black/60 px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.2)] backdrop-blur-sm relative">
                <h1 className="text-4xl md:text-5xl font-bold text-green-400 tracking-[0.15em] font-mono" 
                    style={{ textShadow: '0 0 5px #16a34a, 0 0 10px #dc2626' }}>
                    PHONE RESTORE
                </h1>
                 {/* Holly decoration on sign */}
                 <div className="absolute -top-2 -left-2 flex">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <div className="w-3 h-3 bg-red-600 rounded-full -ml-1"></div>
                    <div className="w-4 h-4 bg-green-700 rotate-45 -ml-1"></div>
                 </div>
                 <div className="absolute -top-2 -right-2 flex">
                    <div className="w-4 h-4 bg-green-700 rotate-45"></div>
                    <div className="w-3 h-3 bg-red-600 rounded-full -ml-1"></div>
                    <div className="w-3 h-3 bg-red-600 rounded-full -ml-1"></div>
                 </div>
                </div>
                <div className="absolute -top-2 right-2 text-3xl">🎅</div>
            </div>
        </>
      )}

      {/* CABLES BOX (Decorated in Christmas Theme) */}
      <div className="absolute left-[20px] top-[420px] w-[100px] h-[60px] border-2 border-gray-600 bg-gray-900/80 z-0 flex items-center justify-center">
          <span className="text-[8px] text-white/50">CABLES</span>
          {isChristmasTheme && (
              // Wrapped in lights
              <div className="absolute -top-2 -left-2 -right-2 h-full flex justify-around items-start border-t-2 border-green-800/50 rounded-t-lg pt-1">
                   <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_4px_red]"></div>
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_4px_lime]" style={{animationDelay:'0.2s'}}></div>
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_4px_blue]" style={{animationDelay:'0.4s'}}></div>
                   <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_4px_gold]" style={{animationDelay:'0.6s'}}></div>
              </div>
          )}
      </div>

      {/* COUNTER (Shared structure, adjusted colors for theme via overlay) */}
      <div className="absolute z-0 bottom-0 left-0 right-0 h-[100px] bg-slate-900 border-t-[8px] border-slate-500 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
         <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
         
         {isChristmasTheme && <div className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay"></div>}
         
         {/* COUNTER TOP LIGHTS (Christmas Mode Only) */}
         {isChristmasTheme && (
             <div className="absolute top-[-4px] left-0 right-0 flex justify-around z-10">
                 {[...Array(15)].map((_, i) => (
                     <div key={i} className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_4px_currentColor]
                         ${i % 3 === 0 ? 'bg-red-500 text-red-500' : i % 3 === 1 ? 'bg-green-500 text-green-500' : 'bg-yellow-400 text-yellow-400'}`}
                         style={{animationDelay: `${i * 0.1}s`, animationName: 'bulb-flash'}}
                     ></div>
                 ))}
             </div>
         )}

         {/* CABLE 1: Left Curve */}
         <div className="absolute bottom-[2px] left-[120px] w-[300px] h-[20px] z-0 opacity-80 pointer-events-none">
             {isChristmasTheme ? (
                 // Christmas Lights String - High Density
                 <>
                    <svg width="100%" height="100%" viewBox="0 0 300 20" preserveAspectRatio="none">
                        <path d="M0,10 Q50,20 100,5 T180,15 T300,10" stroke="#15803d" strokeWidth="2" fill="none" />
                        {/* Bulbs along the path - Increased Density */}
                        <circle cx="30" cy="12" r="3" fill="#ef4444" className="animate-pulse"><animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/></circle>
                        <circle cx="60" cy="16" r="3" fill="#eab308" className="animate-pulse"><animate attributeName="opacity" values="1;0.5;1" dur="1.2s" repeatCount="indefinite"/></circle>
                        <circle cx="90" cy="8" r="3" fill="#3b82f6" className="animate-pulse"><animate attributeName="opacity" values="1;0.5;1" dur="0.8s" repeatCount="indefinite"/></circle>
                        <circle cx="120" cy="5" r="3" fill="#ec4899" className="animate-pulse"><animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/></circle>
                        <circle cx="150" cy="10" r="3" fill="#a855f7" className="animate-pulse"><animate attributeName="opacity" values="1;0.5;1" dur="0.9s" repeatCount="indefinite"/></circle>
                        <circle cx="180" cy="15" r="3" fill="#22c55e" className="animate-pulse"><animate attributeName="opacity" values="1;0.5;1" dur="1.3s" repeatCount="indefinite"/></circle>
                        <circle cx="210" cy="12" r="3" fill="#ef4444" className="animate-pulse"><animate attributeName="opacity" values="1;0.5;1" dur="1.1s" repeatCount="indefinite"/></circle>
                        <circle cx="250" cy="10" r="3" fill="#eab308" className="animate-pulse"><animate attributeName="opacity" values="1;0.5;1" dur="1.4s" repeatCount="indefinite"/></circle>
                    </svg>
                 </>
             ) : (
                 // Standard Cable
                 <svg width="100%" height="100%" viewBox="0 0 300 20" preserveAspectRatio="none">
                     <path d="M0,10 Q50,20 100,5 T180,15 T300,10" stroke="#334155" strokeWidth="3" fill="none" />
                 </svg>
             )}
         </div>

         {/* CABLE 2: Right Curve */}
         <div className="absolute bottom-[5px] right-[80px] w-[200px] h-[25px] z-0 opacity-80 pointer-events-none">
              {isChristmasTheme ? (
                 <>
                    <svg width="100%" height="100%" viewBox="0 0 200 25" preserveAspectRatio="none">
                        <path d="M0,15 Q40,0 80,20 T150,5 T200,15" stroke="#15803d" strokeWidth="2" fill="none" />
                        {/* Bulbs */}
                        <circle cx="20" cy="10" r="3" fill="#3b82f6" className="animate-pulse"/>
                        <circle cx="40" cy="5" r="3" fill="#ef4444" className="animate-pulse"/>
                        <circle cx="60" cy="10" r="3" fill="#eab308" className="animate-pulse"/>
                        <circle cx="80" cy="20" r="3" fill="#ec4899" className="animate-pulse"/>
                        <circle cx="100" cy="15" r="3" fill="#22c55e" className="animate-pulse"/>
                        <circle cx="130" cy="10" r="3" fill="#a855f7" className="animate-pulse"/>
                        <circle cx="150" cy="5" r="3" fill="#ef4444" className="animate-pulse"/>
                        <circle cx="180" cy="10" r="3" fill="#3b82f6" className="animate-pulse"/>
                    </svg>
                 </>
              ) : (
                 <svg width="100%" height="100%" viewBox="0 0 200 25" preserveAspectRatio="none">
                     <path d="M0,15 Q40,0 80,20 T150,5 T200,15" stroke="#1e293b" strokeWidth="4" fill="none" />
                 </svg>
              )}
         </div>
         
         {/* CABLE 3: Tangled Loop */}
         <div className={`absolute bottom-[8px] right-[380px] w-[40px] h-[10px] rounded-[50%] z-0 transform rotate-12 opacity-80 
             ${isChristmasTheme ? 'border-2 border-green-700' : 'border-2 border-gray-600 opacity-50'}`}>
             {isChristmasTheme && (
                 <>
                    <div className="absolute -top-1 left-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-0 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    <div className="absolute -bottom-1 left-3 w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                 </>
             )}
         </div>

         {/* Other Counter Items... Decorated */}
         <div className="absolute top-[30px] left-[100px] w-[300px] h-[40px] bg-black/40 border border-white/10 flex justify-around items-center px-4">
             <div className="w-8 h-4 bg-gray-600 rounded-sm relative">
                {isChristmasTheme && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-sm"></div>}
             </div>
             <div className="w-8 h-4 bg-gray-600 rounded-sm"></div>
             <div className="w-8 h-4 bg-gray-600 rounded-sm relative">
                {isChristmasTheme && <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-sm"></div>}
             </div>
             <div className="w-8 h-4 bg-gray-600 rounded-sm"></div>
         </div>

         <div className="absolute top-[30px] right-[100px] w-[200px] h-[40px] bg-black/40 border border-white/10 flex justify-around items-center px-4">
             <div className="w-12 h-2 bg-green-900/50"></div>
             <div className="w-12 h-2 bg-red-900/50"></div>
         </div>
         
         <div className="absolute bottom-[100px] left-[40px] w-[60px] h-[50px] bg-gray-300 border-b-4 border-gray-500 z-0 transform translate-y-[100%]">
             <div className="w-full h-[20px] bg-gray-400 border-b border-gray-500"></div> 
             <div className="absolute -top-[30px] right-0 w-[50px] h-[30px] bg-gray-200 border-4 border-gray-400"></div> 
             <div className="absolute -top-[30px] left-0 w-[10px] h-[40px] bg-gray-400"></div> 
         </div>

         <div className="absolute -top-[10px] left-[200px] w-[40px] h-[50px] bg-gray-800 border border-gray-600 rotate-12 flex flex-col gap-1 p-1">
            <div className="w-full h-1/2 bg-black/50"></div>
            <div className="w-full h-1/4 bg-green-500/20"></div>
            {isChristmasTheme && (
                // Lights wrapped around box
                <div className="absolute inset-0 border border-red-500/50 rounded-sm flex flex-wrap gap-1 opacity-80">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse ml-auto mt-auto"></div>
                </div>
            )}
         </div>

         <div className="absolute -top-[5px] left-[350px] w-[25px] h-[25px] bg-pink-500 border border-pink-700 rounded-sm rotate-[-15deg] shadow-sm">
             <div className="w-[25px] h-[25px] bg-pink-400 absolute -top-[20px] left-0 border border-pink-600 rounded-sm origin-bottom-left transform rotate-45">
                 <div className="w-[15px] h-[10px] bg-black mx-auto mt-2"></div>
             </div>
         </div>

         <div className="absolute -top-[5px] left-[420px] w-[24px] h-[40px] bg-gray-200 border border-gray-400 rounded-[4px] shadow-sm flex flex-col items-center justify-center rotate-6">
             <div className="w-[20px] h-[28px] bg-black border border-gray-500 rounded-[2px] mt-1"></div> 
             <div className="w-[4px] h-[4px] bg-gray-400 rounded-full mt-1 border border-gray-500"></div> 
         </div>

         <div className="absolute -top-[15px] right-[120px] w-[20px] h-[60px] bg-yellow-100 border border-gray-400 rotate-[80deg] shadow-sm">
             <div className="w-[15px] h-[15px] bg-black mx-auto mt-2"></div>
             <div className="grid grid-cols-3 gap-[1px] mt-4 px-1">
                 {[...Array(9)].map((_,i) => <div key={i} className="w-[2px] h-[2px] bg-gray-800"></div>)}
             </div>
             <div className="absolute -top-6 left-2 w-[4px] h-[20px] bg-black"></div>
         </div>
         
         <div className="absolute -top-[5px] left-[260px] w-[40px] h-[4px] bg-orange-500 rotate-45"></div> 
         <div className="absolute -top-[5px] right-[200px] w-[60px] h-[40px] bg-blue-500/10 border border-blue-400/30"></div> 

      </div>

      <div className="absolute inset-0 z-0 bg-purple-900/10 pointer-events-none mix-blend-overlay"></div>

      {overlayText && !isPaused && (
        <div className="absolute top-1/4 left-0 right-0 text-center z-50 animate-bounce">
          <h2 className={`text-2xl font-bold drop-shadow-md ${isChristmasTheme ? 'text-green-400 drop-shadow-[0_0_5px_red]' : 'text-yellow-400'}`}>{overlayText}</h2>
        </div>
      )}

      {isPaused && (
        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center z-[60]">
            <h2 className="text-4xl text-orange-500 mb-8 font-bold tracking-widest blink">PAUSED</h2>
            <div className="flex flex-col gap-4">
                <Button onClick={() => togglePause()}>RESUME</Button>
                <Button onClick={handleQuit} variant="secondary">QUIT</Button>
            </div>
        </div>
      )}

      <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-50">
        <div className="flex gap-2">
            <div className="bg-gray-800 border-2 border-gray-600 p-2">
              <p className="text-xs text-gray-400">SCORE</p>
              <p className="text-xl text-orange-500">{score.toString().padStart(6, '0')}</p>
            </div>
        </div>

        <div className="flex items-start gap-2">
            <button 
                onClick={toggleChristmasTheme}
                className={`border-2 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:scale-105 active:translate-y-[2px] active:shadow-none transition-all w-10 h-10 flex items-center justify-center
                    ${isChristmasTheme ? 'bg-green-600 border-green-800' : 'bg-orange-500 border-orange-700'}`}
                aria-label="Toggle Holiday Theme"
                title="Toggle Holiday Theme"
            >
                🎄
            </button>

            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="bg-orange-500 border-2 border-orange-700 text-white shadow-[2px_2px_0px_0px_rgba(194,65,12,1)] hover:bg-orange-400 active:translate-y-[2px] active:shadow-none transition-all w-10 h-10 flex items-center justify-center"
              aria-label="Toggle Sound"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            <button 
              onClick={onRestart}
              className="bg-orange-500 border-2 border-orange-700 text-white shadow-[2px_2px_0px_0px_rgba(194,65,12,1)] hover:bg-orange-400 active:translate-y-[2px] active:shadow-none transition-all w-10 h-10 flex items-center justify-center"
              aria-label="Restart Game"
              title="Restart Game"
            >
              🔄
            </button>

            <button 
                onClick={() => togglePause()}
                className="bg-orange-500 border-2 border-orange-700 text-white shadow-[2px_2px_0px_0px_rgba(194,65,12,1)] hover:bg-orange-400 active:translate-y-[2px] active:shadow-none transition-all w-10 h-10 flex items-center justify-center"
                aria-label="Pause"
                title={isPaused ? "Resume" : "Pause"}
            >
                {isPaused ? '▶' : '⏸'}
            </button>

            <div className="bg-gray-800 border-2 border-gray-600 p-2 flex flex-col items-end min-w-[100px] h-10 justify-center">
              <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                  <span key={i} className="text-sm">
                      {i < lives ? '❤️' : '🖤'}
                  </span>
                  ))}
              </div>
            </div>
        </div>
      </div>

      {activePowerUp && !isPaused && (
         <div className="absolute top-20 left-2 bg-blue-900 border-2 border-blue-400 p-2 text-xs text-white animate-pulse z-10">
           ACTIVE: {activePowerUp}
         </div>
      )}

      {catchEffectsRef.current.map(effect => {
        const age = Date.now() - effect.startTime;
        const progress = age / 600;
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        return (
          <div 
            key={effect.id}
            className="absolute pointer-events-none flex flex-col items-center justify-center z-20"
            style={{
              left: effect.x,
              top: effect.y,
              width: ITEM_SIZE,
              height: ITEM_SIZE,
              opacity: 1 - progress,
              transform: `translateY(-${easeOut * 50}px) scale(${1 + easeOut * 0.5})`,
              transition: 'none'
            }}
          >
            <span className="text-4xl drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">{effect.icon}</span>
            <span className={`text-[12px] font-bold ${effect.color} drop-shadow-md mt-1`}>{effect.label}</span>
          </div>
        );
      })}

      {itemsRef.current.map(item => (
        <div 
          key={item.uid}
          className="absolute flex flex-col items-center justify-center"
          style={{ 
            left: item.x, 
            top: item.y, 
            width: ITEM_SIZE, 
            height: ITEM_SIZE 
          }}
        >
          <span className="text-2xl filter drop-shadow-lg">{item.icon}</span>
          <span className={`text-[8px] font-bold ${item.color} bg-black/50 px-1 rounded`}>{item.label}</span>
        </div>
      ))}

      <div 
        className="absolute bottom-0 transition-transform duration-75"
        style={{ 
          left: playerXRef.current, 
          width: PLAYER_WIDTH, 
          height: PLAYER_HEIGHT,
        }}
      >
        <ChrisSprite pose={playerPose} facingRight={facingRight} />
      </div>
      
      </div>

      {!isPaused && (
        <div className="absolute inset-x-0 bottom-0 h-1/2 flex z-50 pointer-events-none">
            <div 
                className="group flex-1 active:bg-white/5 transition-colors pointer-events-auto flex items-end justify-start p-6 touch-manipulation"
                onTouchStart={handleTouchStart('LEFT')}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                <div className="w-24 h-24 rounded-full border-4 border-white/20 bg-black/40 flex items-center justify-center text-white/50 text-4xl md:hidden transition-all group-active:scale-95 group-active:border-orange-500 group-active:text-orange-500 group-active:bg-black/60 shadow-lg">
                  ←
                </div>
            </div>
            
            <div 
                className="group flex-1 active:bg-white/5 transition-colors pointer-events-auto flex items-end justify-end p-6 touch-manipulation"
                onTouchStart={handleTouchStart('RIGHT')}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                <div className="w-24 h-24 rounded-full border-4 border-white/20 bg-black/40 flex items-center justify-center text-white/50 text-4xl md:hidden transition-all group-active:scale-95 group-active:border-orange-500 group-active:text-orange-500 group-active:bg-black/60 shadow-lg">
                  →
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
