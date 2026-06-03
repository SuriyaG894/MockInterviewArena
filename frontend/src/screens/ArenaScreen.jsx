import { useRef, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import HealthBar from '../components/HealthBar.jsx';
import { BOSSES } from '../constants/bosses.js';

export default function ArenaScreen() {
  const { gameState, dispatchTurn, dispatch } = useGame();
  const [input, setInput] = useState('');
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState.battleLog.length]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || gameState.isProcessing) return;

    const hasAlphanumeric = /[a-zA-Z0-9]/.test(trimmed);
    if (trimmed.length < 5 || !hasAlphanumeric) {
      dispatch({
        type: 'SET_ERROR',
        errorLogEntry: {
          sender: 'boss',
          text: '[System Notification: Your response is too short or meaningless. Please provide a substantive answer to the challenge.]',
        },
      });
      return;
    }

    dispatchTurn(trimmed);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isGameOver = gameState.gameStatus === 'GAMEOVER';
  const playerWon = isGameOver && gameState.bossHP <= 0;

  const activeBoss = BOSSES.find((b) => b.id === gameState.selectedBoss) || BOSSES[0];
  const vsColor = activeBoss.theme?.vsColor || 'border-slate-500/40 text-slate-400 shadow-[0_0_15px_rgba(255,255,255,0.1)]';

  return (
    <div className="h-screen flex flex-col bg-[#070a13] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-[#070a13] relative overflow-hidden font-sans">
      {/* Background Cyberpunk Details */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0b_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Top HUD — Combat Health Area */}
      <div className="z-10 flex gap-6 items-center p-4 border-b border-slate-800/80 bg-slate-950/45 backdrop-blur-md">
        {/* Player Profile */}
        <div className="flex-1 flex gap-3 items-center">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-cyan-400 shadow-inner relative">
            💻
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <HealthBar label="CANDIDATE.EXE" hp={gameState.playerHP} isPlayer />
          </div>
        </div>

        {/* VS Badge */}
        <div className={`hidden sm:flex w-10 h-10 rounded-full border bg-slate-950 items-center justify-center text-xs font-mono font-bold select-none ${vsColor}`}>
          VS
        </div>

        {/* Boss Profile */}
        <div className="flex-1 flex gap-3 items-center flex-row-reverse">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-lg shadow-inner relative">
            {activeBoss.icon}
            <span className={`absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full border border-slate-950 animate-pulse ${activeBoss.theme?.hudAccent || 'bg-slate-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <HealthBar
              label={activeBoss.shortName}
              hp={gameState.bossHP}
            />
          </div>
        </div>
      </div>

      {/* Holographic Challenge Banner */}
      {gameState.currentChallenge && (
        <div className="z-10 px-6 py-4 border-b border-slate-800/50 bg-indigo-950/15">
          <div className="max-w-4xl mx-auto flex items-start gap-4 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <span className="text-2xl mt-0.5 animate-bounce">🎯</span>
            <div>
              <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Active Challenge Protocol</div>
              <p className="text-sm font-semibold text-slate-100 leading-relaxed">{gameState.currentChallenge}</p>
            </div>
          </div>
        </div>
      )}

      {/* Center Log Panel — Chat/Combat Log */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-4xl w-full mx-auto z-10 scroll-smooth">
        {gameState.battleLog.map((entry, i) => {
          const isPlayer = entry.sender === 'player';
          const isSystem = entry.text.startsWith('[System');

          if (isSystem) {
            return (
              <div key={i} className="flex justify-center my-4">
                <div className="bg-red-950/30 border border-red-500/30 rounded-xl px-4 py-2 text-xs font-mono text-red-400 flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.1)] animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {entry.text}
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              className={`flex ${isPlayer ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-md border leading-relaxed ${
                  isPlayer
                    ? `bg-slate-900/90 ${activeBoss.theme?.borderAccent || 'border-indigo-500/30'} text-slate-100 rounded-br-sm glow-${activeBoss.theme?.color || 'indigo'} font-mono text-xs font-medium`
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-200 rounded-bl-sm backdrop-blur-sm'
                }`}
              >
                {isPlayer && (
                  <div className={`text-[9px] font-mono ${activeBoss.theme?.textAccent || 'text-indigo-400/80'} mb-1 select-none`}>
                    CANDIDATE_RESPONSE &gt;
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{entry.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={logEndRef} />
      </div>

      {/* Bottom HUD — Terminal Input Console */}
      <div className="border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md p-4 z-10">
        <div className="max-w-4xl mx-auto w-full">
          {gameState.isProcessing ? (
            <div className="flex flex-col items-center justify-center h-24 text-slate-400 gap-2">
              <div className="flex gap-1.5 items-center">
                <span className={`w-2.5 h-2.5 rounded-full animate-bounce ${activeBoss.theme?.hudAccent || 'bg-slate-500'}`} style={{ animationDelay: '0ms' }} />
                <span className={`w-2.5 h-2.5 rounded-full animate-bounce ${activeBoss.theme?.hudAccent || 'bg-slate-500'}`} style={{ animationDelay: '150ms' }} />
                <span className={`w-2.5 h-2.5 rounded-full animate-bounce ${activeBoss.theme?.hudAccent || 'bg-slate-500'}`} style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 animate-pulse">
                Interviewer is evaluating your response...
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-slate-900/40 border border-slate-800 p-3 rounded-xl">
              <div className="flex-1 w-full flex flex-col gap-1.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Submit Proposal</span>
                  <span className="text-[10px] font-mono text-slate-600 hidden sm:inline">Enter to execute</span>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={activeBoss.placeholder}
                  rows={2}
                  className={`w-full bg-slate-950/80 text-slate-100 font-mono text-xs border border-slate-850/85 rounded-lg px-3 py-2.5 resize-none focus:outline-none transition-all placeholder:text-slate-600 leading-relaxed shadow-inner ${activeBoss.theme?.focusRing || 'focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20'}`}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || gameState.isProcessing}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-white transition-all cursor-pointer select-none self-stretch flex items-center justify-center ${
                  !input.trim() || gameState.isProcessing
                    ? 'bg-slate-800/50 border border-slate-700/50 text-slate-500 cursor-not-allowed opacity-40'
                    : activeBoss.theme?.execButton || 'bg-slate-600 border border-slate-500'
                }`}
              >
                Execute
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Game Over Sci-Fi Overlay */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6">
          <div className={`max-w-md w-full border p-8 rounded-2xl text-center bg-slate-900/60 backdrop-blur-md shadow-2xl relative overflow-hidden ${
            playerWon
              ? 'border-emerald-500/40 shadow-emerald-500/10'
              : 'border-red-500/40 shadow-red-500/10'
          }`}>
            {/* Absolute decorative accents */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${playerWon ? 'bg-emerald-500' : 'bg-red-500'}`} />

            <span className="text-5xl mb-4 block select-none">
              {playerWon ? '🏆' : '💀'}
            </span>
            <h2 className={`text-4xl font-black uppercase tracking-tight mb-2 ${
              playerWon 
                ? `text-emerald-400 text-glow-${activeBoss.theme?.color || 'indigo'}` 
                : `text-red-500 text-glow-${activeBoss.theme?.color || 'rose'}`
            }`}>
              {playerWon ? 'Simulation Cleared' : 'Evaluation Failed'}
            </h2>
            <p className="text-xs font-mono uppercase text-slate-500 tracking-widest mb-6">
              Session Terminated
            </p>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              {playerWon
                ? 'Excellent work. Your proposal met all evaluation metrics, successfully convincing the interviewer.'
                : (activeBoss.id === 'architect' 
                    ? 'Insufficient architecture specification. Your design resulted in catastrophic failures.'
                    : activeBoss.id === 'cto'
                      ? 'Pragmatism failure. Your code compromises resulted in a chaotic collapse.'
                      : activeBoss.id === 'pm'
                        ? 'Insufficient product alignment. Your feature prioritization resulted in poor metrics and project cancellation.'
                        : 'Unresolved edge cases. Critical production bugs went undetected, causing complete application downtime.')}
            </p>
            <button
              onClick={() => dispatch({ type: 'RESET' })}
              className={`w-full py-3 rounded-xl font-mono text-sm font-bold uppercase tracking-wider text-white transition-all cursor-pointer ${
                playerWon
                  ? 'bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-red-600 border border-red-500 hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
              }`}
            >
              Restart Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
