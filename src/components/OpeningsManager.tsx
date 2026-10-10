import React, { useState } from 'react';
import { Opening, WallSide, OpeningType } from '../types';
import { Plus, Trash2, Pencil, DoorOpen, LayoutGrid, Car, Check, ArrowRight, X } from 'lucide-react';

interface OpeningsManagerProps {
  openings: Opening[];
  length: number;
  width: number;
  studSpacing: number;
  onChange: (openings: Opening[]) => void;
}

export const OpeningsManager: React.FC<OpeningsManagerProps> = ({
  openings,
  length,
  width,
  studSpacing,
  onChange,
}) => {
  const [editingOpening, setEditingOpening] = useState<Opening | null>(null);
  const isNew = editingOpening ? !openings.some((o) => o.id === editingOpening.id) : false;

  const getWallLength = (wall: WallSide) => (wall === 'front' || wall === 'back' ? length : width);
  const currentWallLength = editingOpening ? getWallLength(editingOpening.wall) : length;

  const handleStartAdd = () => {
    setEditingOpening({
      id: `op_${Date.now()}`,
      name: 'Нове вікно',
      type: 'window',
      wall: 'front',
      offsetFromCorner: 1.0,
      width: 1.2,
      height: 1.4,
      bottomOffset: 0.85,
    });
  };

  const handleStartEdit = (op: Opening) => {
    setEditingOpening({ ...op });
  };

  const handleSave = () => {
    if (!editingOpening) return;
    const exists = openings.some((o) => o.id === editingOpening.id);
    if (exists) {
      onChange(openings.map((o) => (o.id === editingOpening.id ? editingOpening : o)));
    } else {
      onChange([...openings, editingOpening]);
    }
    setEditingOpening(null);
  };

  const handleDelete = (id: string) => {
    if (editingOpening?.id === id) {
      setEditingOpening(null);
    }
    onChange(openings.filter((o) => o.id !== id));
  };

  const applyTemplate = (
    name: string,
    type: OpeningType,
    w: number,
    h: number,
    bot: number
  ) => {
    if (!editingOpening) return;
    setEditingOpening({
      ...editingOpening,
      name,
      type,
      width: w,
      height: h,
      bottomOffset: bot,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DoorOpen className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">
            Прорізи: вікна, двері, ворота ({openings.length})
          </h3>
        </div>
        {!editingOpening && (
          <button
            onClick={handleStartAdd}
            className="text-xs px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold flex items-center gap-1.5 shadow-md shadow-amber-900/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Додати проріз</span>
          </button>
        )}
      </div>

      {/* Opening List */}
      <div className="space-y-2">
        {openings.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-400">
            Не додано жодного вікна чи дверей. Стіни глухі.
          </div>
        ) : (
          openings.map((op) => {
            const wallName =
              op.wall === 'front'
                ? `Фасад (${length}м)`
                : op.wall === 'back'
                ? `Задня (${length}м)`
                : op.wall === 'left'
                ? `Ліва (${width}м)`
                : `Права (${width}м)`;

            const isDoor = op.type === 'door' || op.type === 'garage_door';
            const isBeingEdited = editingOpening?.id === op.id;

            return (
              <div
                key={op.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  isBeingEdited
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-md shadow-amber-950/20'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg border ${
                    isBeingEdited 
                      ? 'bg-amber-500 text-slate-950 border-amber-400' 
                      : 'bg-slate-900 text-amber-400 border-slate-800'
                  }`}>
                    {op.type === 'garage_door' ? (
                      <Car className="w-4 h-4" />
                    ) : op.type === 'door' ? (
                      <DoorOpen className="w-4 h-4" />
                    ) : (
                      <LayoutGrid className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>{op.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {wallName}
                      </span>
                      {isBeingEdited && (
                        <span className="text-[10px] text-amber-400 font-medium">
                          (Редагується...)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      Розмір: <span className="text-amber-400">{op.width} × {op.height} м</span>
                      {' • '}Відступ: <span className="text-white">{op.offsetFromCorner} м</span>
                      {!isDoor && (
                        <>
                          {' • '}Підвіконня: <span className="text-slate-300">{op.bottomOffset} м</span>
                        </>
                      )}
                      {' • '}Перекриває: <span className="text-amber-300 font-bold">{Math.floor(op.width / (studSpacing / 1000))} стійок</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(op)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title="Редагувати параметри прорізу"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(op.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Видалити"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Opening Form */}
      {editingOpening && (
        <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-4 shadow-lg shadow-amber-950/20">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-amber-400" />
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                {isNew ? 'Додавання нового прорізу' : `Редагування: ${editingOpening.name}`}
              </h4>
            </div>
            <button
              onClick={() => setEditingOpening(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick templates */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">
              Швидкі шаблони розмірів:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => applyTemplate('Гаражні ворота', 'garage_door', 2.8, 2.2, 0)}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded text-left text-slate-300"
              >
                🚗 Ворота 2.8×2.2м
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('Вхідні двері', 'door', 0.9, 2.05, 0)}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded text-left text-slate-300"
              >
                🚪 Двері 0.9×2.05м
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('Вікно 1.2×1.4', 'window', 1.2, 1.4, 0.85)}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded text-left text-slate-300"
              >
                🪟 Вікно 1.2×1.4м
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('Кватирка 0.6×0.6', 'window', 0.6, 0.6, 1.3)}
                className="p-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded text-left text-slate-300"
              >
                🪟 Кватирка 0.6×0.6м
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Назва / Опис:</span>
              <input
                type="text"
                value={editingOpening.name}
                onChange={(e) =>
                  setEditingOpening({ ...editingOpening, name: e.target.value })
                }
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
              />
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Оберіть стіну:</span>
              <select
                value={editingOpening.wall}
                onChange={(e) =>
                  setEditingOpening({
                    ...editingOpening,
                    wall: e.target.value as WallSide,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
              >
                <option value="front">Фасадна стіна (довжина {length} м)</option>
                <option value="back">Задня стіна (довжина {length} м)</option>
                <option value="left">Ліва стіна (ширина {width} м)</option>
                <option value="right">Права стіна (ширина {width} м)</option>
              </select>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Відстань від кута (м):</span>
              <input
                type="number"
                step="0.05"
                min="0.2"
                max={Math.max(0.2, currentWallLength - editingOpening.width)}
                value={editingOpening.offsetFromCorner}
                onChange={(e) =>
                  setEditingOpening({
                    ...editingOpening,
                    offsetFromCorner: parseFloat(e.target.value) || 0.2,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Ширина прорізу (м):</span>
              <input
                type="number"
                step="0.05"
                min="0.4"
                max="5.0"
                value={editingOpening.width}
                onChange={(e) =>
                  setEditingOpening({
                    ...editingOpening,
                    width: parseFloat(e.target.value) || 0.4,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Висота прорізу (м):</span>
              <input
                type="number"
                step="0.05"
                min="0.4"
                max="3.0"
                value={editingOpening.height}
                onChange={(e) =>
                  setEditingOpening({
                    ...editingOpening,
                    height: parseFloat(e.target.value) || 0.4,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <span className="text-slate-400 block mb-1">
                Від підлоги (м) [0 для дверей]:
              </span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="2.0"
                value={editingOpening.bottomOffset}
                onChange={(e) =>
                  setEditingOpening({
                    ...editingOpening,
                    bottomOffset: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
          </div>

          {/* Validation note */}
          <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-amber-400" />
              Проріз займає зону від <strong className="text-white font-mono">{editingOpening.offsetFromCorner}м</strong> до{' '}
              <strong className="text-white font-mono">
                {(editingOpening.offsetFromCorner + editingOpening.width).toFixed(2)}м
              </strong>{' '}
              на стіні {currentWallLength}м.
            </span>
            <span
              className={`font-mono font-bold ${
                editingOpening.offsetFromCorner + editingOpening.width <= currentWallLength
                  ? 'text-emerald-400'
                  : 'text-red-400'
              }`}
            >
              {editingOpening.offsetFromCorner + editingOpening.width <= currentWallLength
                ? '✅ Вміщується'
                : '❌ За межами стіни!'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingOpening(null)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white text-xs"
            >
              Скасувати
            </button>
            <button
              type="button"
              disabled={
                editingOpening.offsetFromCorner + editingOpening.width > currentWallLength
              }
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/20"
            >
              <Check className="w-4 h-4" />
              <span>{isNew ? 'Додати до списку' : 'Зберегти зміни'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
