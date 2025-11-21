
import React, { useState } from 'react';
import { UI_COPY } from '../constants';
import { Button } from './Button';
import { LeadInfo } from '../types';

interface LeadFormProps {
  onComplete: (data: LeadInfo | null) => void;
  isPostGame?: boolean;
}

export const LeadForm: React.FC<LeadFormProps> = ({ onComplete, isPostGame = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      onComplete({ name, email });
    }
  };

  const handleSkip = () => {
    onComplete(null);
  };

  return (
    <div className="w-full max-w-md p-6 bg-gray-800 border-4 border-gray-600 shadow-2xl text-center relative">
      <h2 className="text-xl text-orange-400 mb-4">{isPostGame ? "Save Your Score" : "JOIN THE NEWSLETTER"}</h2>
      <p className="text-xs text-gray-300 mb-6 leading-loose">
        {isPostGame ? "Join the leaderboard and get your personalized growth strategy." : UI_COPY.leadCapture.body}
      </p>
      
      <div className="mb-6 bg-gray-900 p-3 border-2 border-dashed border-gray-600">
        <p className="text-green-400 text-xs">🎁 {UI_COPY.leadCapture.rewardText}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="text-left">
          <label className="block text-xs text-orange-500 mb-1">OPERATOR NAME</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-900 border-2 border-gray-700 p-2 text-white focus:border-orange-500 outline-none font-sans"
            placeholder="Chris Koerner"
            required
          />
        </div>
        <div className="text-left">
          <label className="block text-xs text-orange-500 mb-1">EMAIL ADDRESS</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-900 border-2 border-gray-700 p-2 text-white focus:border-orange-500 outline-none font-sans"
            placeholder="chris@leadarcade.com"
            required
          />
        </div>

        <div className="text-left mt-2">
           <p className="text-[10px] text-gray-500">
             By clicking below, you agree to receive the Lead Arcade newsletter. Unsubscribe anytime.
           </p>
        </div>
        
        <Button type="submit" className="mt-2">
          {isPostGame ? "VIEW RESULTS" : "UNLOCK GAME"}
        </Button>
      </form>

      {!isPostGame && (
        <button 
          onClick={handleSkip}
          className="mt-4 text-[10px] text-gray-500 underline hover:text-gray-300 cursor-pointer w-full text-center"
        >
          No thanks, I don't want the guide. Just let me play.
        </button>
      )}
    </div>
  );
};