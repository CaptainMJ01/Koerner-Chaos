import React, { useMemo } from 'react';
import { PROFILES, UI_COPY } from '../constants.js';
import { Button } from './Button.js';

export const ResultCard = ({ score, highScores, onRestart, onHome }) => {
  // Determine profile synchronously for share text purposes only
  const profile = useMemo(() => {
    if (score < 1000) return PROFILES.OPERATOR;
    else if (score < 2500) return PROFILES.BUILDER;
    else if (score < 5000) return PROFILES.STRATEGIST;
    else return PROFILES.VISIONARY;
  }, [score]);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://leadarcade.com';
  const encodedText = encodeURIComponent(profile.shareText.replace('{score}', score.toString()));
  const encodedUrl = encodeURIComponent(currentUrl);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`; // LinkedIn mainly uses OG tags
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  return (
    <div className="w-full max-w-2xl bg-gray-800 border-4 border-orange-600 p-6 text-center shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div className="retro-scanline absolute inset-0 z-0"></div>
      <div className="relative z-10">
        <h1 className="text-3xl md:text-4xl text-red-500 mb-2">{UI_COPY.gameover.title}</h1>
        <p className="text-gray-400 mb-6">{UI_COPY.gameover.subtitle}</p>

        <div className="bg-black border-2 border-gray-600 p-4 mb-6">
          <p className="text-sm text-gray-500">FINAL SCORE</p>
          <p className="text-4xl text-yellow-400 font-bold">{score.toLocaleString()}</p>
        </div>

        {/* Leaderboard Section */}
        <div className="mb-6 bg-black/40 p-4 border border-gray-700 w-full max-w-lg mx-auto">
           <h3 className="text-yellow-400 text-xs mb-3 uppercase tracking-widest border-b border-gray-700 pb-2">Top Players</h3>
           {highScores.length > 0 ? (
            <table className="w-full text-left text-xs">
              <tbody>
                {highScores.map((entry, index) => (
                  <tr key={index} className={`border-b border-gray-800 ${entry.score === score ? 'text-orange-400 animate-pulse' : 'text-gray-400'}`}>
                    <td className="py-2 pl-2 w-8 text-gray-600">{index + 1}.</td>
                    <td className="py-2">{entry.name}</td>
                    <td className="py-2 pr-2 text-right font-bold">{entry.score.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
           ) : (
             <p className="text-xs text-gray-600 italic">No scores yet.</p>
           )}
        </div>

        {/* Social Share Section */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-2">SHARE YOUR RESULTS</p>
          <div className="flex gap-2 justify-center">
            <a href={twitterUrl} target="_blank" rel="noreferrer" className="bg-black border-2 border-gray-600 p-2 hover:border-blue-400 text-white text-xs">
              TWITTER / X
            </a>
            <a href={linkedInUrl} target="_blank" rel="noreferrer" className="bg-black border-2 border-gray-600 p-2 hover:border-blue-700 text-white text-xs">
              LINKEDIN
            </a>
            <a href={facebookUrl} target="_blank" rel="noreferrer" className="bg-black border-2 border-gray-600 p-2 hover:border-blue-600 text-white text-xs">
              FACEBOOK
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center border-t border-gray-700 pt-6">
          <Button onClick={onRestart}>PLAY AGAIN</Button>
          <Button onClick={onHome} variant="secondary">BACK TO HOME</Button>
        </div>
      </div>
    </div>
  );
};