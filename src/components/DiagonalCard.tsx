import React from 'react';
import { Compass, CheckCircle2 } from 'lucide-react';

interface DiagonalCardProps {
  length: number;
  width: number;
  diagonal: number;
}

export const DiagonalCard: React.FC<DiagonalCardProps> = ({ length, width, diagonal }) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white">
              Контроль прямого кута (Діагоналі фундаменту)
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20">
              DIY Захист від перекосу
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            При зовнішніх розмірах каркасу <span className="text-white font-mono">{length} × {width} м</span>, обидві протилежні діагоналі мають становити рівно:
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0">
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Точна діагональ:</div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tracking-tight">
            {diagonal.toFixed(2)} <span className="text-sm text-slate-400 font-normal">м</span>
          </div>
        </div>
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      </div>
    </div>
  );
};
