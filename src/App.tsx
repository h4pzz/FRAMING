import { useState, useMemo } from 'react';
import { DEFAULT_INPUTS } from './utils/presets';
import { calculateBuilding } from './utils/calculator';
import { BuildingInputs, Opening } from './types';
import { Header } from './components/Header';
import { BuildingForm } from './components/BuildingForm';
import { OpeningsManager } from './components/OpeningsManager';
import { NormativeAlerts } from './components/NormativeAlerts';
import { Schematic2D } from './components/Schematic2D';
import { MaterialsSummary } from './components/MaterialsSummary';
import { DiagonalCard } from './components/DiagonalCard';
import { ShieldCheck } from 'lucide-react';

export function App() {
  const [inputs, setInputs] = useState<BuildingInputs>(DEFAULT_INPUTS);

  // Real-time calculation engine
  const result = useMemo(() => {
    return calculateBuilding(inputs);
  }, [inputs]);

  const handleSelectPreset = (presetInputs: Partial<BuildingInputs>) => {
    setInputs(prev => ({
      ...prev,
      ...presetInputs
    }));
  };

  const handlePriceChange = (key: keyof BuildingInputs['prices'], value: number) => {
    setInputs(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [key]: value
      }
    }));
  };

  const handleOpeningsChange = (openings: Opening[]) => {
    setInputs(prev => ({
      ...prev,
      openings
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header onSelectPreset={handleSelectPreset} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Normative Alerts & Linter Bar */}
        <NormativeAlerts alerts={result.alerts} />

        {/* Foundation Diagonal Helper */}
        <DiagonalCard 
          length={inputs.length} 
          width={inputs.width} 
          diagonal={result.diagonalM} 
        />

        {/* Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Configurator & Openings Manager (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <BuildingForm inputs={inputs} onChange={setInputs} />
            
            {/* Dynamic Openings Manager */}
            <OpeningsManager 
              openings={inputs.openings}
              length={inputs.length}
              width={inputs.width}
              studSpacing={inputs.studSpacing}
              onChange={handleOpeningsChange}
            />
          </div>

          {/* Right Column: Visualizer & Materials / Hardware (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 2D Schematic Canvas with Top-Down, Wall Elevation & Roof views */}
            <Schematic2D inputs={inputs} diagonal={result.diagonalM} />

            {/* Comprehensive Materials, Hardware, Thermal & Cost tabs */}
            <MaterialsSummary 
              result={result} 
              inputs={inputs} 
              onPriceChange={handlePriceChange} 
            />
          </div>
        </div>
      </main>

      {/* Footer with Normative References */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>
              WOODCALC: Розрахунки відповідають ДБН В.2.6-161:2017, ДБН В.2.6-31:2021, International Residential Code (IRC) та СП 31-105-2002.
            </span>
          </div>
          <div className="text-slate-400 font-mono">
            Розроблено для практичного DIY будівництва
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
