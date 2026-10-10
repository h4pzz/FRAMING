import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { NormativeAlert, BuildingInputs } from '../types';

interface NormativeAlertsProps {
  alerts: NormativeAlert[];
  onApplyFix?: (updater: Partial<BuildingInputs>) => void;
}

export const NormativeAlerts: React.FC<NormativeAlertsProps> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isDanger = alert.type === 'danger';
        const isWarning = alert.type === 'warning';
        const isSuccess = alert.type === 'success';

        let borderClass = 'border-sky-500/30 bg-sky-950/20 text-sky-200';
        let icon = <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />;

        if (isDanger) {
          borderClass = 'border-red-500/50 bg-red-950/30 text-red-200 shadow-lg shadow-red-950/20';
          icon = <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />;
        } else if (isWarning) {
          borderClass = 'border-amber-500/40 bg-amber-950/25 text-amber-200';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
        } else if (isSuccess) {
          borderClass = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
        }

        return (
          <div
            key={alert.id}
            className={`p-3.5 rounded-xl border ${borderClass} transition-all duration-200`}
          >
            <div className="flex items-start gap-3">
              {icon}
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm sm:text-base tracking-tight text-white">
                    {alert.title}
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700/60 text-slate-400">
                    {alert.normReference}
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-1.5 opacity-90 leading-relaxed">
                  {alert.message}
                </p>
                {alert.recommendation && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/40 text-xs flex items-center gap-1.5 font-medium text-amber-300">
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    <span>{alert.recommendation}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
