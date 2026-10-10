import React from 'react';
import { Hammer, Sparkles } from 'lucide-react';
import { PRESETS } from '../utils/presets';
import { BuildingInputs } from '../types';

interface HeaderProps {
  onSelectPreset: (presetInputs: Partial<BuildingInputs>) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSelectPreset }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl shadow-lg shadow-amber-900/30 text-white">
                <Hammer className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    WOODCALC
                  </h1>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    DIY Framework 2.0
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Інженерний калькулятор каркасних споруд з нормативним лінтером (ДБН / IRC / СП 31-105)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Готові шаблони:
            </span>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPreset(p.inputs)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500/50 transition-all flex items-center gap-1.5 active:scale-95"
                title={p.desc}
              >
                <span>{p.icon}</span>
                <span className="font-medium">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
