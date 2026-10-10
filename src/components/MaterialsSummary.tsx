import React, { useState } from 'react';
import { CalculationResult, BuildingInputs } from '../types';
import { 
  TreePine, 
  Wrench, 
  Flame, 
  Receipt, 
  Copy, 
  Check, 
  Printer, 
  Info,
  Zap,
  TrendingDown
} from 'lucide-react';

interface MaterialsSummaryProps {
  result: CalculationResult;
  inputs: BuildingInputs;
  onPriceChange: (key: keyof BuildingInputs['prices'], value: number) => void;
}

export const MaterialsSummary: React.FC<MaterialsSummaryProps> = ({ 
  result, 
  inputs,
  onPriceChange 
}) => {
  const [activeTab, setActiveTab] = useState<'lumber' | 'hardware' | 'thermal' | 'costs'>('lumber');
  const [copied, setCopied] = useState(false);

  // Copy shopping list to clipboard
  const handleCopyShoppingList = () => {
    const lines = [
      `📋 ЧЕК-ЛИСТ ЗАКУПІВЛІ (WOODCALC)`,
      `Споруда: ${inputs.length}×${inputs.width} м, висота ${inputs.wallHeight} м (${inputs.buildingType})`,
      `---------------------------------------`,
      `🪵 ПИЛОМАТЕРІАЛИ (${result.totalLumberM3} м³):`,
      ...result.lumberItems.map(
        (it) => `• Дошка ${it.section} × ${it.stockLengthM}м — ${it.piecesNeeded} шт. (${it.volumeM3} м³) [${it.description}]`
      ),
      ``,
      `🔩 КРІПЛЕННЯ ТА МЕТИЗИ:`,
      `• Цвяхи 90 мм (для каркасу): ${result.hardware.nails90Kg} кг (~${result.hardware.nails90Pcs} шт.)`,
      `• Цвяхи 60 мм (для OSB/обшивки): ${result.hardware.nails60Kg} кг (~${result.hardware.nails60Pcs} шт.)`,
      `• Анкери фундаментні М12: ${result.hardware.anchorsM12Pcs} шт.`,
      `• Кутики для крокв (KRD): ${result.hardware.rafterBracketsPcs} шт.`,
      ``,
      `📦 ПЛИТНІ МАТЕРІАЛИ ТА ІЗОЛЯЦІЯ:`,
      `• Плити OSB стіни: ${result.sheathingWallSheets} листів`,
      `• Плити OSB покрівля: ${result.sheathingRoofSheets} листів`,
      `• Утеплювач: ${result.insulationM3} м³`,
      `• Пароізоляція: ${result.vaporBarrierM2} м²`,
      `• Вітрозахисна супердифузійна мембрана: ${result.windBarrierM2} м²`,
      `---------------------------------------`,
      `💰 ОРІЄНТОВНИЙ БЮДЖЕТ: ~${result.costs.grandTotal.toLocaleString()} грн`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 overflow-x-auto">
        {[
          { id: 'lumber', label: 'Деревина та розкрій', icon: <TreePine className="w-4 h-4" /> },
          { id: 'hardware', label: 'Фурнітура та кріплення', icon: <Wrench className="w-4 h-4" /> },
          { id: 'thermal', label: 'Тепловтрати та ДБН', icon: <Flame className="w-4 h-4" /> },
          { id: 'costs', label: 'Кошторис та Бюджет', icon: <Receipt className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-6">
        {/* TAB 1: LUMBER & CUTTING */}
        {activeTab === 'lumber' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block">Загальний об'єм пиломатеріалу:</span>
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {result.totalLumberM3} <span className="text-base text-slate-400 font-normal">м³</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Базова довжина дошки:</span>
                <span className="text-sm font-semibold font-mono text-white">
                  {inputs.commercialLength === 0 ? '⚡ Автопідбір (мін. відхід)' : `${inputs.commercialLength / 1000} м`}
                </span>
              </div>
            </div>

            {/* Lumber Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2.5">Переріз</th>
                    <th className="pb-2.5">Призначення</th>
                    <th className="pb-2.5 text-center">Довжина</th>
                    <th className="pb-2.5 text-center">Кількість</th>
                    <th className="pb-2.5 text-center">Об'єм</th>
                    <th className="pb-2.5 text-right">Відхід</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {result.lumberItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3 font-bold text-amber-400">{item.section}</td>
                      <td className="py-3 font-sans text-xs text-slate-300">{item.description}</td>
                      <td className="py-3 text-center text-slate-300">{item.stockLengthM} м</td>
                      <td className="py-3 text-center font-bold text-white bg-slate-800/40 rounded px-2">
                        {item.piecesNeeded} шт.
                      </td>
                      <td className="py-3 text-center text-slate-300">{item.volumeM3} м³</td>
                      <td className="py-3 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                          item.wastePercent <= 5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          ~{item.wastePercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sheathing summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 block mb-1">Обшивка стін ({inputs.wallSheathing}):</span>
                <span className="text-base font-bold text-white font-mono">{result.sheathingWallSheets} листів</span> (2500×1250)
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 block mb-1">Обшивка покрівлі ({inputs.roofSheathing}):</span>
                <span className="text-base font-bold text-white font-mono">{result.sheathingRoofSheets} листів</span> (2500×1250)
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HARDWARE & FASTENERS */}
        {activeTab === 'hardware' && (
          <div className="space-y-5">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/90 leading-relaxed">
                <strong>Нормативне «Правило цвяхового бою» (СП 31-105 табл. 7-1 / IRC Table 9.23.3.4):</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-300/80">
                  <li>Дошка 100 мм $\to$ 2 цвяхи 90 мм у торець.</li>
                  <li>Дошка 150 мм $\to$ 3 цвяхи 90 мм у торець.</li>
                  <li>Дошка 200 мм $\to$ 4 цвяхи 90 мм у торець.</li>
                  <li>Обшивка OSB: крок 150 мм по периметру листа і 300 мм по проміжних стійках.</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Framing Nails */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">Цвяхи для каркасу (90 мм)</h4>
                  <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Гладкі / гвинтові
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-mono text-white">{result.hardware.nails90Kg}</span>
                  <span className="text-sm text-slate-400">кг (~{result.hardware.nails90Pcs} шт.)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Для збивання стійок, нижньої та подвійної верхньої обв'язки, кутів і кроквяних затяжок (+15% запас).
                </p>
              </div>

              {/* Sheathing Nails */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">Цвяхи для OSB / фанери (60 мм)</h4>
                  <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    Йоржовані (Ring shank)
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-mono text-white">{result.hardware.nails60Kg}</span>
                  <span className="text-sm text-slate-400">кг (~{result.hardware.nails60Pcs} шт.)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Розраховано за нормативним кроком (по ~40 цвяхів на один лист OSB). Йоржовані цвяхи не вилазять при висиханні дерева!
                </p>
              </div>

              {/* Foundation Anchors */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">Анкери фундаментні М12 (з шайбами)</h4>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    До бетону
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-mono text-white">{result.hardware.anchorsM12Pcs}</span>
                  <span className="text-sm text-slate-400">шт.</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Кріплення лежня до фундаменту з кроком 1.2–1.4 м та обов'язково по 2 шт. на кожному куті.
                </p>
              </div>

              {/* Rafter Brackets */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">Покрівельні кутики (KRD) / пластини</h4>
                  <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    Hurricane Ties
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold font-mono text-white">{result.hardware.rafterBracketsPcs}</span>
                  <span className="text-sm text-slate-400">шт.</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Посилене кріплення крокв до верхньої обв'язки стін проти вітрового зриву даху.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: THERMAL & ENERGY */}
        {activeTab === 'thermal' && (
          <div className="space-y-5">
            {inputs.thermalType === 'cold' ? (
              <div className="p-5 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                <Flame className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <h4 className="text-white font-medium">Обрано холодний режим споруди (без утеплення)</h4>
                <p className="text-xs mt-1 max-w-md mx-auto">
                  Для холодного сараю чи неопалюваного гаража тепловий розрахунок не потрібен. Щоб побачити тепловтрати та потрібний обігрівач, оберіть «Теплий» або «Житловий» режим.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* DBN Status Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  result.thermal.isCompliant
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                    : 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                }`}>
                  <div>
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      {result.thermal.isCompliant ? '✅ Відповідає нормам ДБН В.2.6-31:2021' : '⚠️ Нижче житлової норми ДБН (підвищені тепловтрати)'}
                    </h4>
                    <p className="text-xs mt-1 opacity-80">
                      Опір стін: R = {result.thermal.wallR} м²·К/Вт (норма ДБН: ≥{result.thermal.dbnRequiredRWall}) | Опір даху: R = {result.thermal.roofR} м²·К/Вт (норма ДБН: ≥{result.thermal.dbnRequiredRRoof})
                    </p>
                  </div>
                </div>

                {/* Practical Heating Insights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <Zap className="w-4 h-4 text-amber-400" /> Пікові тепловтрати (-22°C)
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">
                      {result.thermal.peakHeatLossKw} <span className="text-sm font-normal text-slate-400">кВт</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      У найлютіший мороз
                    </span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <Flame className="w-4 h-4 text-orange-400" /> Рекомендована потужність
                    </div>
                    <div className="text-2xl font-bold font-mono text-orange-400">
                      ~{result.thermal.recommendedHeaterKw} <span className="text-sm font-normal text-slate-400">кВт</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Обігрівач / конвектор (+25% запас)
                    </span>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <TrendingDown className="w-4 h-4 text-emerald-400" /> Орієнтовно на місяць взимку
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      ~{result.thermal.estimatedWinterMonthlyCostUah.toLocaleString()} <span className="text-sm font-normal text-slate-400">грн</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      При електроопаленні (4.32 грн/кВт)
                    </span>
                  </div>
                </div>

                {/* Insulation Bill */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                  <h5 className="font-semibold text-white">Потрібні ізоляційні матеріали:</h5>
                  <div className="grid grid-cols-3 gap-2 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Мінвата (базальт):</span>
                      <span className="text-white font-bold">{result.insulationM3} м³</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Пароізоляція (всередині):</span>
                      <span className="text-white font-bold">{result.vaporBarrierM2} м²</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Вітробар'єр (ззовні):</span>
                      <span className="text-white font-bold">{result.windBarrierM2} м²</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COSTS & ESTIMATE */}
        {activeTab === 'costs' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-amber-700/10 border border-amber-500/30 rounded-xl">
              <div>
                <span className="text-xs text-amber-300 uppercase tracking-wider block font-semibold">
                  Орієнтовний бюджет матеріалів (коробка каркасу):
                </span>
                <span className="text-3xl font-bold font-mono text-white">
                  ~{result.costs.grandTotal.toLocaleString()} <span className="text-lg text-amber-400 font-normal">грн</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyShoppingList}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-900/30 transition-all active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Скопійовано в буфер!' : 'Скопіювати чек-лист'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                  title="Роздрукувати"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editable Unit Prices */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Налаштуйте актуальні ціни вашого регіону (грн):
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Дошка (грн/м³):</span>
                  <input
                    type="number"
                    value={inputs.prices.lumberPerM3}
                    onChange={(e) => onPriceChange('lumberPerM3', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Разом: {result.costs.lumberTotal.toLocaleString()} грн</span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Лист OSB (грн/шт):</span>
                  <input
                    type="number"
                    value={inputs.prices.osbSheet}
                    onChange={(e) => onPriceChange('osbSheet', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Разом: {result.costs.sheathingTotal.toLocaleString()} грн</span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Вата (грн/м³):</span>
                  <input
                    type="number"
                    value={inputs.prices.insulationPerM3}
                    onChange={(e) => onPriceChange('insulationPerM3', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Разом: {result.costs.insulationTotal.toLocaleString()} грн</span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Кріплення (пакет):</span>
                  <div className="text-amber-400 font-mono font-bold py-1">
                    {result.costs.hardwareTotal.toLocaleString()} грн
                  </div>
                  <span className="text-[10px] text-slate-400 block">Цвяхи 90/60мм + анкери</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
