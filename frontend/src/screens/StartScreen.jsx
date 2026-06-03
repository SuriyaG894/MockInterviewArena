import { useGame } from '../context/GameContext.jsx';
import { BOSSES } from '../constants/bosses.js';

function getRandomChallenge(boss) {
  const randomIndex = Math.floor(Math.random() * boss.challenges.length);
  return boss.challenges[randomIndex];
}

export default function StartScreen() {
  const { dispatch } = useGame();

  function selectBoss(boss) {
    const randomChallenge = getRandomChallenge(boss);
    dispatch({
      type: 'SET_BOSS',
      payload: boss.id,
      welcomeMessage: `${boss.welcome}\n\nChallenge: ${randomChallenge}`,
      challenge: randomChallenge,
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070a13] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-[#070a13] p-6 relative overflow-hidden">
      {/* Background Grid & Blur Details */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0b_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center z-10 max-w-2xl mb-12">
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

      {/* Cards */}
      <div className="flex gap-8 flex-wrap justify-center z-10 max-w-4xl w-full">
        {BOSSES.map((boss) => {
          const borderHover = boss.theme?.borderHover || 'hover:border-slate-500/80 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]';
          const tagColor = boss.theme?.tagColor || 'bg-slate-950/30 text-slate-300 border-slate-500/10';

          return (
            <button
              key={boss.id}
              onClick={() => selectBoss(boss)}
              className={`w-80 sm:w-92 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md flex flex-col gap-4 text-left transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${borderHover}`}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-3xl p-2.5 bg-slate-950/50 border border-slate-850 rounded-xl shadow-inner">{boss.icon}</span>
                <span className="text-xs font-mono font-bold bg-slate-950/60 border border-slate-850/60 px-2 py-0.5 rounded text-slate-400">
                  DIFF: {boss.difficulty}
                </span>
              </div>

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
            </button>
          );
        })}
      </div>
    </div>
  );
}
