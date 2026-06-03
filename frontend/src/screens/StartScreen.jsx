import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { BOSSES } from '../constants/bosses.js';

function getRandomChallenge(boss) {
  const randomIndex = Math.floor(Math.random() * boss.challenges.length);
  return boss.challenges[randomIndex];
}

export default function StartScreen() {
  const { gameState, dispatch } = useGame();
  const [isStarting, setIsStarting] = useState(null);
  const [profileInput, setProfileInput] = useState(gameState.candidateProfile || '');
  const fileInputRef = useRef(null);
  const [uploadStatus, setUploadStatus] = useState(''); // '', 'uploading', 'success', 'error'
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setProfileInput(gameState.candidateProfile || '');
  }, [gameState.candidateProfile]);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadError('File size limit exceeded. Maximum size is 5MB.');
      return;
    }

    setUploadStatus('uploading');
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process resume');
      }

      setProfileInput(data.text);
      setUploadStatus('success');
    } catch (err) {
      setUploadStatus('error');
      setUploadError(err.message || 'Verification failed. Please try again.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function selectBoss(boss) {
    setIsStarting(boss.id);
    let challenge = '';
    let welcomeMessage = '';

    try {
      const response = await fetch('http://127.0.0.1:5000/api/battle/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bossId: boss.id, 
          difficulty: gameState.difficulty,
          candidateProfile: profileInput,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        challenge = data.challenge;
        welcomeMessage = data.welcomeMessage;
      }
    } catch (err) {
      console.warn("Failed to generate dynamic challenge, falling back to static:", err);
    }

    if (!challenge) {
      const randomChallenge = getRandomChallenge(boss);
      challenge = randomChallenge;
      welcomeMessage = `${boss.welcome}\n\nChallenge: ${randomChallenge}`;
    }

    dispatch({
      type: 'SET_BOSS',
      payload: boss.id,
      welcomeMessage,
      challenge,
      candidateProfile: profileInput,
    });
    setIsStarting(null);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070a13] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-[#070a13] p-6 relative overflow-hidden">
      {/* Background Grid & Blur Details */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0b_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center z-10 max-w-2xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Interactive System Simulator v1.0
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-3 bg-gradient-to-r from-slate-50 via-white to-slate-400 bg-clip-text text-transparent">
          The Mock Arena
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Select an interviewer profile to initiate the evaluation simulation.
        </p>
      </div>

      {/* Target Difficulty Selector */}
      <div className="z-10 flex flex-col items-center gap-3 mb-10">
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
          Target Difficulty Protocol
        </span>
        <div className="flex p-1 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md relative">
          {['easy', 'medium', 'hard'].map((level) => {
            const active = gameState.difficulty === level;
            let activeStyle = '';
            if (active) {
              if (level === 'easy') activeStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
              else if (level === 'medium') activeStyle = 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
              else activeStyle = 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
            } else {
              activeStyle = 'border-transparent text-slate-500 hover:text-slate-300';
            }
            return (
              <button
                key={level}
                disabled={isStarting !== null}
                onClick={() => dispatch({ type: 'SET_DIFFICULTY', payload: level })}
                className={`px-5 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${activeStyle} ${
                  isStarting !== null ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Candidate Profile / Resume Context */}
      <div className="z-10 w-full max-w-xl flex flex-col gap-3 mb-10">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
            Candidate Profile Protocol (Resume / Keywords)
          </span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx"
            className="hidden"
          />
          <button
            disabled={isStarting !== null || uploadStatus === 'uploading'}
            onClick={() => fileInputRef.current?.click()}
            className={`px-3 py-1 rounded border text-[9px] font-mono font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              uploadStatus === 'uploading'
                ? 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/30 shadow-inner'
            }`}
          >
            {uploadStatus === 'uploading' ? 'Analyzing...' : 'Upload PDF/DOCX'}
          </button>
        </div>
        
        <textarea
          disabled={isStarting !== null || uploadStatus === 'uploading'}
          value={profileInput}
          onChange={(e) => setProfileInput(e.target.value)}
          placeholder='Paste your resume text or upload your PDF/Word document to extract technical details and dynamically tailor the interview focus...'
          rows={3}
          className="w-full bg-slate-950/60 text-slate-100 font-mono text-xs border border-slate-800/80 rounded-xl px-4 py-3 resize-none focus:outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/10 backdrop-blur-md leading-relaxed shadow-inner"
        />

        {uploadStatus === 'uploading' && (
          <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest animate-pulse px-1">
            ⌁ [EXTRACTING PROFILE CONTEXT & CLASSIFYING DOCUMENT...]
          </span>
        )}
        {uploadStatus === 'success' && (
          <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest px-1">
            ✓ [RESUME VERIFIED & PARSED SUCCESSFULLY]
          </span>
        )}
        {uploadStatus === 'error' && (
          <span className="text-[9px] font-mono text-rose-500 uppercase tracking-widest px-1">
            ✗ [UPLOAD FAILED: {uploadError}]
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex gap-8 flex-wrap justify-center z-10 max-w-4xl w-full">
        {BOSSES.map((boss) => {
          const borderHover = boss.theme?.borderHover || 'hover:border-slate-500/80 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]';
          const tagColor = boss.theme?.tagColor || 'bg-slate-950/30 text-slate-300 border-slate-500/10';
          const cardLoading = isStarting === boss.id;

          return (
            <button
              key={boss.id}
              onClick={() => selectBoss(boss)}
              disabled={isStarting !== null}
              className={`w-80 sm:w-92 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md flex flex-col gap-4 text-left transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
                isStarting !== null ? 'opacity-60 cursor-not-allowed' : borderHover
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-3xl p-2.5 bg-slate-950/50 border border-slate-850 rounded-xl shadow-inner">{boss.icon}</span>
                <span className="text-xs font-mono font-bold bg-slate-950/60 border border-slate-850/60 px-2 py-0.5 rounded text-slate-400">
                  DIFF: {boss.difficulty}
                </span>
              </div>

              {cardLoading ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 w-full">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest animate-pulse">
                    Generating protocol...
                  </span>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                      {boss.title}
                    </h2>
                    <p className="text-xs text-slate-400/80 mt-2 leading-relaxed min-h-[50px]">
                      {boss.description}
                    </p>
                  </div>

                  <div className="w-full h-[1px] bg-slate-800/40" />

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Specialties</span>
                    <ul className="flex flex-wrap gap-1.5">
                      {boss.specialties.map((s) => (
                        <li
                          key={s}
                          className={`text-[10px] px-2.5 py-0.5 rounded border ${tagColor}`}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
