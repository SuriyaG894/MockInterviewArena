export default function HealthBar({ label, hp, isPlayer }) {
  const clampedHp = Math.max(0, Math.min(100, hp));

  // Determine bar gradients and glow shadow color
  let barGradient = 'from-emerald-400 to-cyan-500 shadow-cyan-500/30';
  let labelColor = 'text-cyan-400';
  if (clampedHp <= 20) {
    barGradient = 'from-rose-500 to-red-600 shadow-rose-500/40';
    labelColor = 'text-rose-400';
  } else if (clampedHp <= 50) {
    barGradient = 'from-amber-400 to-orange-500 shadow-amber-500/30';
    labelColor = 'text-amber-400';
  }

  return (
    <div className={`flex flex-col gap-1.5 w-full ${isPlayer ? '' : 'items-end'}`}>
      <div className={`flex items-baseline gap-2 ${isPlayer ? 'flex-row' : 'flex-row-reverse'}`}>
        <span className="text-sm font-bold text-slate-100 uppercase tracking-wider">
          {label}
        </span>
        <span className={`text-xs font-mono font-bold ${labelColor} px-2 py-0.5 rounded-md bg-slate-950/70 border border-slate-800/80`}>
          {clampedHp}/100 HP
        </span>
      </div>
      <div className="w-full h-3.5 bg-slate-950/90 rounded-full border border-slate-800/80 p-0.5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out shadow-[0_0_10px] ${barGradient}`}
          style={{ width: `${clampedHp}%` }}
        />
      </div>
    </div>
  );
}
