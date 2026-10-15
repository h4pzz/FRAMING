import React, { useState } from 'react';
import { 
  BuildingInputs, 
  BuildingType, 
  ThermalType, 
  RoofType, 
  LumberType, 
  CommercialLength, 
  SheathingType,
  WallThicknessOption
} from '../types';
import { 
  Home, 
  Warehouse, 
  Car, 
  Flame, 
  ThermometerSnowflake, 
  Settings2, 
  Layers, 
  Maximize2, 
  ShieldCheck,
  Ruler,
  TrendingUp,
  Calculator,
  Check,
  AlertCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { calculateMonoRoofSlopeDetails } from '../utils/calculator';

interface BuildingFormProps {
  inputs: BuildingInputs;
  onChange: (inputs: BuildingInputs) => void;
}

export const BuildingForm: React.FC<BuildingFormProps> = ({ inputs, onChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [calcFeedback, setCalcFeedback] = useState<string | null>(null);
  const [showZeroDeltaPrompt, setShowZeroDeltaPrompt] = useState(false);

  const update = <K extends keyof BuildingInputs>(key: K, value: BuildingInputs[K]) => {
    onChange({
      ...inputs,
      [key]: value
    });
  };

  const thicknessOptions: { value: WallThicknessOption; label: string; desc: string; badge?: string }[] = [
    { value: 100, label: '100 мм', desc: 'Холодний / сарай', badge: 'Економ' },
    { value: 120, label: '120 мм', desc: '100мм + 20мм МДВП' },
    { value: 150, label: '150 мм', desc: 'Стандарт каркасу', badge: 'Оптимум' },
    { value: 180, label: '180 мм', desc: '150мм + 30мм контр' },
    { value: 200, label: '200 мм', desc: 'Норма ДБН для житла', badge: 'ДБН R≥3.3' },
    { value: 250, label: '250 мм', desc: 'Енергоефективний', badge: 'Пасивний' },
  ];

  const monoDetails = calculateMonoRoofSlopeDetails(inputs);

  const handleAutoCalculateAngle = () => {
    const details = calculateMonoRoofSlopeDetails(inputs);
    if (!details.hasUnevenWalls) {
      setShowZeroDeltaPrompt(true);
      return;
    }
    onChange({
      ...inputs,
      roofPitchAngle: details.calculatedAngle,
      isUnevenWalls: true,
    });
    setCalcFeedback(
      `✓ Кут ${details.calculatedAngle}° розраховано за висотами стін (перепад: ${(details.deltaH * 100).toFixed(0)} см, внутр. проліт: ${details.innerSpan.toFixed(2)} м)`
    );
    setTimeout(() => setCalcFeedback(null), 5000);
  };

  const handleApplyRecommendedDelta = () => {
    const baseH = inputs.wallHeight || 2.4;
    const highH = Number((baseH + 0.5).toFixed(2));
    const newWallHeights = {
      front: highH,
      back: baseH,
      left: Number(((highH + baseH) / 2).toFixed(2)),
      right: Number(((highH + baseH) / 2).toFixed(2)),
    };
    const updatedInputs: BuildingInputs = {
      ...inputs,
      isCustomWallHeights: true,
      isUnevenWalls: true,
      wallHeights: newWallHeights,
    };
    const details = calculateMonoRoofSlopeDetails(updatedInputs);
    onChange({
      ...updatedInputs,
      roofPitchAngle: details.calculatedAngle,
    });
    setShowZeroDeltaPrompt(false);
    setCalcFeedback(
      `✓ Задано перепад стін (фасад: ${highH} м, задня: ${baseH} м) та розраховано кут ${details.calculatedAngle}°`
    );
    setTimeout(() => setCalcFeedback(null), 5000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
      {/* 1. Purpose & Thermal Mode */}
      <div>
        <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-3">
          <Layers className="w-3.5 h-3.5 text-amber-400" /> 1. Призначення споруди
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'shed', label: 'Хозблок / Сарай', icon: <Warehouse className="w-4 h-4" /> },
            { id: 'garage', label: 'Гараж / Майстерня', icon: <Car className="w-4 h-4" /> },
            { id: 'house', label: 'Житловий будинок', icon: <Home className="w-4 h-4" /> },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => update('buildingType', item.id as BuildingType)}
              className={`p-3 rounded-xl border text-left flex flex-col items-center sm:items-start gap-1.5 transition-all text-xs sm:text-sm font-medium ${
                inputs.buildingType === item.id
                  ? 'border-amber-500 bg-amber-500/10 text-white shadow-md shadow-amber-950/20'
                  : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className={`${inputs.buildingType === item.id ? 'text-amber-400' : 'text-slate-400'}`}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Thermal choice */}
        <div className="mt-3">
          <span className="text-[11px] text-slate-400 block mb-1.5">Режим експлуатації:</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cold', label: 'Холодний', sub: 'Без утеплення', defThick: 100, icon: <ThermometerSnowflake className="w-3.5 h-3.5 text-sky-400" /> },
              { id: 'warm', label: 'Теплий', sub: 'Періодичний обігрів', defThick: 150, icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> },
              { id: 'residential', label: 'Житловий', sub: 'Цілорічний ДБН', defThick: 200, icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const t = item.id as ThermalType;
                  onChange({
                    ...inputs,
                    thermalType: t,
                    studWidth: item.defThick as WallThicknessOption
                  });
                }}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                  inputs.thermalType === item.id
                    ? 'border-amber-500/60 bg-amber-500/15 text-white'
                    : 'border-slate-800/80 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] text-slate-400">{item.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* WALL THICKNESS SELECTOR (100 - 120 - 150 - 180 - 200 - 250) */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-amber-400" /> Товщина стіни / утеплення:
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {inputs.studWidth} мм
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {thicknessOptions.map((opt) => {
              const isSelected = inputs.studWidth === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('studWidth', opt.value)}
                  className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/20 text-white shadow-md shadow-amber-950/30'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className={`font-mono font-bold text-xs sm:text-sm ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                    {opt.label}
                  </div>
                  <div className="text-[9px] text-slate-400 leading-tight mt-0.5 truncate w-full">
                    {opt.desc}
                  </div>
                  {opt.badge && (
                    <span className={`text-[8px] px-1 py-0.2 mt-1 rounded font-mono ${
                      isSelected ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {opt.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Dimensions & Uneven Wall Heights */}
      <div className="pt-4 border-t border-slate-800/80">
        <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-3">
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" /> 2. Габарити споруди та висота стін
        </label>
        
        {/* Length & Width */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <span className="text-xs text-slate-400 block mb-1">Довжина (м)</span>
            <input
              type="number"
              step="0.1"
              min="2.0"
              max="25.0"
              value={inputs.length}
              onChange={(e) => update('length', parseFloat(e.target.value) || 2.0)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <span className="text-xs text-slate-400 block mb-1">Ширина (м)</span>
            <input
              type="number"
              step="0.1"
              min="2.0"
              max="15.0"
              value={inputs.width}
              onChange={(e) => update('width', parseFloat(e.target.value) || 2.0)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Height Mode Switcher: Same height vs Custom height for each wall */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inputs.isCustomWallHeights}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const currentH = inputs.wallHeight || 2.4;
                  onChange({
                    ...inputs,
                    isCustomWallHeights: checked,
                    isUnevenWalls: checked,
                    roofType: checked ? 'mono' : inputs.roofType,
                    wallHeights: inputs.wallHeights || {
                      front: currentH,
                      back: Math.max(1.8, currentH - 0.5),
                      left: currentH - 0.25,
                      right: currentH - 0.25,
                    },
                  });
                }}
                className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                Всі стіни різні (ввести висоту кожної)
              </span>
            </label>

            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
              {inputs.isCustomWallHeights ? 'Індивідуальні висоти' : 'Єдина висота'}
            </span>
          </div>

          {!inputs.isCustomWallHeights ? (
            /* Uniform wall height (single input) */
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">
                  Висота всіх стін (м):
                </span>
                <span className="text-xs font-mono text-slate-300">
                  {((inputs.wallHeight || 2.4) * 100).toFixed(0)} см
                </span>
              </div>
              <input
                type="number"
                step="0.05"
                min="1.8"
                max="5.0"
                value={inputs.wallHeight}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 2.4;
                  onChange({
                    ...inputs,
                    wallHeight: val,
                    wallHeights: {
                      front: val,
                      back: val,
                      left: val,
                      right: val,
                    },
                  });
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          ) : (
            /* Individual height input for each wall */
            <div className="space-y-3 pt-1 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">
                Введіть висоту для кожної стіни (у метрах або сантиметрах):
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Front Wall */}
                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-medium text-slate-200">Фасадна стіна:</span>
                    <span className="font-mono text-amber-400 text-[10px]">
                      {((inputs.wallHeights?.front || inputs.wallHeight) * 100).toFixed(0)} см
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="1.5"
                    max="5.0"
                    value={inputs.wallHeights?.front ?? inputs.wallHeight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 2.0;
                      onChange({
                        ...inputs,
                        wallHeights: {
                          ...(inputs.wallHeights || { front: val, back: val, left: val, right: val }),
                          front: val,
                        },
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs focus:border-amber-500"
                  />
                </div>

                {/* Back Wall */}
                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-medium text-slate-200">Задня стіна:</span>
                    <span className="font-mono text-amber-400 text-[10px]">
                      {((inputs.wallHeights?.back || inputs.wallHeight) * 100).toFixed(0)} см
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="1.5"
                    max="5.0"
                    value={inputs.wallHeights?.back ?? inputs.wallHeight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 2.0;
                      onChange({
                        ...inputs,
                        wallHeights: {
                          ...(inputs.wallHeights || { front: val, back: val, left: val, right: val }),
                          back: val,
                        },
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs focus:border-amber-500"
                  />
                </div>

                {/* Left Wall */}
                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-medium text-slate-200">Ліва стіна (бічна):</span>
                    <span className="font-mono text-amber-400 text-[10px]">
                      {((inputs.wallHeights?.left || inputs.wallHeight) * 100).toFixed(0)} см
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="1.5"
                    max="5.0"
                    value={inputs.wallHeights?.left ?? inputs.wallHeight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 2.0;
                      onChange({
                        ...inputs,
                        wallHeights: {
                          ...(inputs.wallHeights || { front: val, back: val, left: val, right: val }),
                          left: val,
                        },
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs focus:border-amber-500"
                  />
                </div>

                {/* Right Wall */}
                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-medium text-slate-200">Права стіна (бічна):</span>
                    <span className="font-mono text-amber-400 text-[10px]">
                      {((inputs.wallHeights?.right || inputs.wallHeight) * 100).toFixed(0)} см
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="1.5"
                    max="5.0"
                    value={inputs.wallHeights?.right ?? inputs.wallHeight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 2.0;
                      onChange({
                        ...inputs,
                        wallHeights: {
                          ...(inputs.wallHeights || { front: val, back: val, left: val, right: val }),
                          right: val,
                        },
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Automatic slope calculation banner */}
              {(() => {
                const angle = monoDetails.calculatedAngle;
                const dH = monoDetails.deltaH;

                return (
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-amber-500/30 text-xs text-slate-300 space-y-1.5 shadow-md shadow-amber-950/20">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        📐 Автоматичний розрахунок ухилу даху:
                      </span>
                      <span className="font-mono text-amber-400 font-bold text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {angle}°
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800 gap-y-1">
                      <span>
                        Перепад висот: <strong className="text-white font-mono">{dH.toFixed(2)} м ({(dH * 100).toFixed(0)} см)</strong>
                      </span>
                      <span>
                        Внутр. проліт: <strong className="text-white font-mono">{monoDetails.innerSpan.toFixed(2)} м</strong>
                      </span>
                      <span className={`font-mono font-bold ${Number(angle) >= 8.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {Number(angle) >= 8.5 ? '✅ Сток води норм (≥8.5°)' : '⚠️ Малий кут для металу (<8.5°)'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* 3. Lumber Selection & Commercial Length */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            🪵 3. Пиломатеріал та довжина дошки
          </label>
          <span className="text-[11px] text-amber-400 font-mono">
            {inputs.lumberType === 'planed40' ? 'Товщина 40 мм' : inputs.lumberType === 'planed45' ? 'Товщина 45 мм' : 'Товщина 50 мм'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'planed40', name: 'Суха стругана 40 мм', sub: 'Калібрована, точна геометрія' },
            { id: 'planed45', name: 'Євро/сканді 45 мм', sub: 'Стандарт Скандинавії' },
            { id: 'sawn50', name: 'Пиляна свіжопил 50 мм', sub: 'Обрізна природної вологості' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => update('lumberType', item.id as LumberType)}
              className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
                inputs.lumberType === item.id
                  ? 'border-amber-500 bg-amber-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-xs font-medium">{item.name}</span>
              <span className="text-[10px] text-slate-400">{item.sub}</span>
            </button>
          ))}
        </div>

        {/* Commercial Stock Length */}
        <div className="mt-3">
          <span className="text-xs text-slate-400 block mb-1.5 flex items-center justify-between">
            <span>Довжина дошки для закупівлі:</span>
            <span className="text-[10px] text-slate-400">Для розрахунку розкрою та відходів</span>
          </span>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 0, label: '⚡ Авто-підбір', sub: 'мін. відхід' },
              { id: 4000, label: '4.0 м', sub: '4000 мм' },
              { id: 4500, label: '4.5 м', sub: '4500 мм' },
              { id: 6000, label: '6.0 м', sub: '6000 мм' },
            ].map((len) => (
              <button
                key={len.id}
                type="button"
                onClick={() => update('commercialLength', len.id as CommercialLength)}
                className={`py-2 px-1 text-center rounded-lg border text-xs transition-all ${
                  inputs.commercialLength === len.id
                    ? 'border-amber-500 bg-amber-500/20 text-white font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>{len.label}</div>
                <div className="text-[10px] opacity-70">{len.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Roof Configuration */}
      <div className="pt-4 border-t border-slate-800/80">
        <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-3">
          🏠 4. Конструкція покрівлі
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'mono', label: 'Односкатна', icon: '📐' },
            { id: 'gable', label: 'Двоскатна', icon: '⛺' },
            { id: 'mansard', label: 'Мансардна', icon: '🏢' },
          ].map((rf) => (
            <button
              key={rf.id}
              type="button"
              onClick={() => {
                const rt = rf.id as RoofType;
                onChange({
                  ...inputs,
                  roofType: rt,
                  isUnevenWalls: rt === 'mono' ? inputs.isUnevenWalls : false
                });
              }}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                inputs.roofType === rf.id
                  ? 'border-amber-500 bg-amber-500/10 text-white font-medium'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-base mr-1.5">{rf.icon}</span>
              <span className="text-xs">{rf.label}</span>
            </button>
          ))}
        </div>

        {/* Roof Pitch Angle & Rafter Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 block">Кут нахилу (° градуси)</span>
              {inputs.roofType === 'mono' && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {monoDetails.hasUnevenWalls ? `за стінами: ${monoDetails.calculatedAngle}°` : 'стіни однакові'}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                min="3"
                max="60"
                value={inputs.roofPitchAngle}
                onChange={(e) => update('roofPitchAngle', parseFloat(e.target.value) || 15)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:border-amber-500 text-sm"
              />

              {inputs.roofType === 'mono' && (
                <button
                  type="button"
                  onClick={handleAutoCalculateAngle}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-semibold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/30 active:scale-95 shrink-0"
                  title="Розрахувати кут автоматично з урахуванням висот стін та спирання крокви на нижній край верхньої обв'язки"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Авто°</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Крокви покрівлі</span>
            <select
              value={inputs.rafterWidth}
              onChange={(e) => update('rafterWidth', parseInt(e.target.value) as 100 | 150 | 200 | 250)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 text-xs h-[38px]"
            >
              <option value="100">Дошка 100 мм (проліт &lt;2.2м)</option>
              <option value="150">Дошка 150 мм (проліт &lt;3.5м)</option>
              <option value="200">Дошка 200 мм (норма для снігу)</option>
              <option value="250">Дошка 250 мм (проліт &gt;5м)</option>
            </select>
          </div>
        </div>

        {/* Feedback message after auto-calculation */}
        {calcFeedback && (
          <div className="mt-2.5 p-2.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{calcFeedback}</span>
          </div>
        )}

        {/* Modal/Prompt if user clicks auto-calc but walls have zero delta */}
        {showZeroDeltaPrompt && (
          <div className="mt-2.5 p-3 bg-amber-950/60 border border-amber-500/50 rounded-xl text-xs text-amber-200 space-y-2.5 animate-fadeIn">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Висоти стін зараз однакові (перепад 0 см)</p>
                <p className="text-amber-300/90 text-[11px] mt-0.5">
                  Для односкатного даху потрібен перепад між протилежними стінами. Бажаєте автоматично задати рекомендований перепад?
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleApplyRecommendedDelta}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Встановити рекомендований перепад (+50 см)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowZeroDeltaPrompt(false)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-all"
              >
                Закрити
              </button>
            </div>
          </div>
        )}

        {/* Mono Roof Structural Node Explanation (Rafter Resting on Lower Edge of Upper Plate) */}
        {inputs.roofType === 'mono' && (
          <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                Вузол спирання крокви на подвійну обв'язку:
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                ДБН В.2.6-161 / IRC R802
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-[11px] font-mono">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Внутрішній проліт:</span>
                <span className="text-white font-bold">{monoDetails.innerSpan.toFixed(2)} м</span>
                <span className="text-slate-500 block text-[9px]">(габарит {monoDetails.outerSpan.toFixed(2)}м - 2×{inputs.studWidth}мм)</span>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Перепад висот (ΔH):</span>
                <span className="text-amber-400 font-bold">{monoDetails.deltaH.toFixed(2)} м</span>
                <span className="text-slate-500 block text-[9px]">({(monoDetails.deltaH * 100).toFixed(0)} см)</span>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-slate-500 block text-[10px]">Розрахунковий кут:</span>
                <span className="text-emerald-400 font-bold">{monoDetails.calculatedAngle}°</span>
                <span className="text-slate-500 block text-[9px]">atan(ΔH / L_внутр)</span>
              </div>
            </div>

            {monoDetails.hasUnevenWalls && Math.abs(inputs.roofPitchAngle - monoDetails.calculatedAngle) >= 0.2 && (
              <div className="flex items-center justify-between pt-1 text-[11px] text-amber-400/90 bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
                <span>
                  Поточний кут ({inputs.roofPitchAngle}°) відрізняється від геометричного ({monoDetails.calculatedAngle}°).
                </span>
                <button
                  type="button"
                  onClick={handleAutoCalculateAngle}
                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px] ml-2 shrink-0 transition-all"
                >
                  Синхронізувати
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Foundation / Floor */}
      <div className="pt-4 border-t border-slate-800/80">
        <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-3">
          🧱 5. Підлога / Фундамент
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => update('floorType', 'slab')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              inputs.floorType === 'slab'
                ? 'border-amber-500 bg-amber-500/10 text-white'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-medium">Бетонна плита / стяжка</div>
            <div className="text-[10px] text-slate-400">Часто для гаражів / хозблоків</div>
          </button>

          <button
            type="button"
            onClick={() => update('floorType', 'wooden')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              inputs.floorType === 'wooden'
                ? 'border-amber-500 bg-amber-500/10 text-white'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-medium">Дерев'яне перекриття (лаги)</div>
            <div className="text-[10px] text-slate-400">Палі, стовпчики або ростверк</div>
          </button>
        </div>

        {inputs.floorType === 'wooden' && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Висота балки лаги:</span>
              <select
                value={inputs.floorJoistWidth}
                onChange={(e) => update('floorJoistWidth', parseInt(e.target.value) as 100 | 150 | 200 | 250)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              >
                <option value="100">100 мм (до 1.8м проліт)</option>
                <option value="150">150 мм (до 3.0м проліт)</option>
                <option value="200">200 мм (до 4.2м проліт)</option>
                <option value="250">250 мм (до 5.2м проліт)</option>
              </select>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Крок лаг перекриття:</span>
              <select
                value={inputs.floorJoistSpacing}
                onChange={(e) => update('floorJoistSpacing', parseInt(e.target.value) as 400 | 600)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              >
                <option value="600">600 мм (стандарт під вату)</option>
                <option value="400">400 мм (посилена жорсткість)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Advanced toggle */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2 px-3 text-xs text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1.5 border border-dashed border-slate-800 rounded-xl hover:border-amber-500/40 transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>{showAdvanced ? 'Приховати обшивку та крок стійок' : 'Налаштувати обшивку (OSB) та крок стійок'}</span>
        </button>
      </div>

      {showAdvanced && (
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div>
            <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Обшивка стін</h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'osb12', label: 'OSB-3 (12 мм)', sub: 'стандарт' },
                { id: 'osb9', label: 'OSB-3 (9 мм)', sub: 'економ' },
                { id: 'mdvp20', label: 'МДВП (Белтермо 20мм)', sub: 'паропроникне' },
                { id: 'none', label: 'Без плит (укосини)', sub: 'під сайдинг/профіль' },
              ].map((sh) => (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => update('wallSheathing', sh.id as SheathingType)}
                  className={`p-2 rounded-lg border text-left text-xs ${
                    inputs.wallSheathing === sh.id
                      ? 'border-amber-500 bg-amber-500/20 text-white font-medium'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <div>{sh.label}</div>
                  <div className="text-[10px] opacity-70">{sh.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Крок стійок каркасу:</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 600, label: '600 мм', sub: 'стандарт під вату' },
                { value: 400, label: '400 мм', sub: 'посилена стіна' },
                { value: 625, label: '625 мм', sub: 'під плити 1250мм' },
              ].map((sp) => (
                <button
                  key={sp.value}
                  type="button"
                  onClick={() => update('studSpacing', sp.value as 400 | 600 | 625)}
                  className={`p-2 rounded-lg border text-left text-xs ${
                    inputs.studSpacing === sp.value
                      ? 'border-amber-500 bg-amber-500/20 text-white font-medium'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  <div>{sp.label}</div>
                  <div className="text-[10px] opacity-70">{sp.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
