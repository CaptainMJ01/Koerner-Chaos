import React, { useState, useEffect } from 'react';
import { GameState } from './types.js';
import { UI_COPY, GAME_WIDTH, GAME_HEIGHT, HIGH_SCORE_KEY } from './constants.js';
import { GameEngine } from './components/GameEngine.js';
import { LeadForm } from './components/LeadForm.js';
import { ResultCard } from './components/ResultCard.js';
import { Button } from './components/Button.js';

const App = () => {
  const [gameState, setGameState] = useState(GameState.MENU);
  const [finalScore, setFinalScore] = useState(0);
  const [userData, setUserData] = useState(null);
  const [highScores, setHighScores] = useState([]);
  const [gameId, setGameId] = useState(0);

  // Load high scores on mount
  useEffect(() => {
    const storedScores = localStorage.getItem(HIGH_SCORE_KEY);
    if (storedScores) {
      try {
        setHighScores(JSON.parse(storedScores));
      } catch (e) {
        console.error("Failed to parse high scores", e);
      }
    }
  }, []);

  const startGame = () => {
    setGameState(GameState.PLAYING);
  };

  const handleLeadSubmit = (data) => {
    setUserData(data);
    if (data) {
      console.log("Lead captured:", data);
    } else {
      console.log("User skipped lead capture (Guest Mode)");
    }
    startGame();
  };

  const handleGameOver = (score) => {
    setFinalScore(score);
    
    // Update High Scores only if user provided data
    if (userData) {
      const newEntry = { name: userData.name, score };
      const newScores = [...highScores, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Keep top 5
      
      setHighScores(newScores);
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(newScores));
    }

    setGameState(GameState.RESULTS);
  };

  const restartGame = () => {
    setGameId(prev => prev + 1);
    setGameState(GameState.PLAYING);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black p-0 md:p-4 overflow-hidden">
      {/* Retro TV Frame Effect - Reduced padding on mobile */}
      <div className="relative w-full max-w-[900px] aspect-[4/3] bg-gray-900 md:rounded-lg md:border-8 border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center">
        
        {/* Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

        {/* Main Content */}
        <div className="relative w-full h-full flex flex-col items-center justify-center" style={{ maxWidth: GAME_WIDTH, maxHeight: GAME_HEIGHT }}>
          
          {gameState === GameState.MENU && (
            <div className="text-center p-4 md:p-8 space-y-4 md:space-y-6 animate-fade-in w-full max-w-2xl flex flex-col items-center overflow-y-auto h-full justify-center">
              <h1 className="text-3xl md:text-6xl text-orange-500 font-bold drop-shadow-[4px_4px_0_rgba(0,0,0,1)] stroke-black leading-normal">
                {UI_COPY.start.title}
              </h1>
              <p className="text-gray-400 text-xs md:text-base">
                {UI_COPY.start.subtitle}
              </p>
              
              <div className="py-2 w-full max-w-md">
                <div className="text-xs text-gray-300 mb-4 border-2 border-gray-700 p-4 bg-black/80 rounded-sm shadow-lg">
                   <p className="mb-3 text-orange-400 font-bold tracking-widest border-b border-gray-700 pb-2">HOW TO PLAY</p>
                   
                   <div className="flex flex-col gap-3">
                     <div className="flex items-center justify-center gap-3 bg-gray-900/50 p-2 rounded border border-gray-800">
                        <span className="text-gray-400 font-bold">MOVE:</span>
                        <div className="flex gap-2">
                          <div className="bg-gray-700 border-b-4 border-gray-900 rounded px-2 py-1 text-white font-bold min-w-[30px] flex items-center justify-center">←</div>
                          <div className="bg-gray-700 border-b-4 border-gray-900 rounded px-2 py-1 text-white font-bold min-w-[30px] flex items-center justify-center">→</div>
                        </div>
                        <span className="text-gray-500 text-[10px] uppercase">or Tap Sides</span>
                     </div>

                     <div className="space-y-2 text-left px-2 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💡</span> 
                          <span>Catch <span className="text-yellow-400 font-bold">IDEAS</span> for points</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">❤️</span> 
                          <span>Miss an IDEA <span className="text-red-500 font-bold">LOSE A LIFE</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔔</span> 
                          <span>Hit DISTRACTION <span className="text-red-500 font-bold">LOSE A LIFE</span></span>
                        </div>
                     </div>
                   </div>
                </div>
              </div>

              <Button onClick={() => setGameState(GameState.LEAD_CAPTURE)} className="text-lg md:text-xl animate-pulse">
                {UI_COPY.start.cta}
              </Button>

              {/* High Score List */}
              <div className="mt-4 w-full max-w-xs">
                <h3 className="text-yellow-400 text-sm mb-2 uppercase border-b border-gray-700 pb-1">Leaderboard</h3>
                {highScores.length > 0 ? (
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="pb-1">#</th>
                        <th className="pb-1">NAME</th>
                        <th className="pb-1 text-right">SCORE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highScores.map((entry, index) => (
                        <tr key={index} className={index === 0 ? "text-orange-300" : "text-gray-300"}>
                          <td className="py-1">{index + 1}</td>
                          <td className="py-1 truncate max-w-[100px]">{entry.name}</td>
                          <td className="py-1 text-right">{entry.score.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-gray-600 italic">No high scores yet. Be the first!</p>
                )}
              </div>
            </div>
          )}

          {gameState === GameState.LEAD_CAPTURE && (
            <LeadForm onComplete={handleLeadSubmit} />
          )}

          {gameState === GameState.PLAYING && (
            <GameEngine 
              key={gameId} 
              onGameOver={handleGameOver} 
              onRestart={restartGame}
            />
          )}

          {gameState === GameState.RESULTS && (
            <ResultCard 
              score={finalScore} 
              highScores={highScores}
              onRestart={restartGame} 
              onHome={() => setGameState(GameState.MENU)} 
            />
          )}

        </div>
      </div>
      
      {/* CRT Flicker Effect */}
      <style>{`
        @keyframes flicker {
          0% { opacity: 0.97; }
          5% { opacity: 0.95; }
          10% { opacity: 0.9; }
          15% { opacity: 0.95; }
          20% { opacity: 0.99; }
          100% { opacity: 0.94; }
        }
        .animate-fade-in {
          animation: flicker 0.15s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280; 
        }
      `}</style>
    </div>
  );
};

export default App;