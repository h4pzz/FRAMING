import React, { useState } from 'react';
import { BuildingInputs, WallSide } from '../types';
import { Layers, ZoomIn } from 'lucide-react';

interface Schematic2DProps {
  inputs: BuildingInputs;
  diagonal: number;
}

export const Schematic2D: React.FC<Schematic2DProps> = ({ inputs, diagonal }) => {
  const [viewMode, setViewMode] = useState<'plan' | 'wall' | 'roof'>('plan');
  const [selectedWall, setSelectedWall] = useState<WallSide>('front');

  // Hover 2x zoom state (display only, no interactivity)
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
      setZoomPos({ x, y });
    }
  };

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 380;
  const padding = 55;

  // Scale calculations for top-down plan
  const availableW = svgWidth - 2 * padding;
  const availableH = svgHeight - 2 * padding;
  const scale = Math.min(availableW / inputs.length, availableH / inputs.width);

  const rectW = inputs.length * scale;
  const rectH = inputs.width * scale;
  const startX = (svgWidth - rectW) / 2;
  const startY = (svgHeight - rectH) / 2;

  // Calculate stud positions along top/bottom walls
  const studSpacingPx = (inputs.studSpacing / 1000) * scale;
  const studsCountL = Math.floor(rectW / studSpacingPx);
  const studsL = Array.from({ length: studsCountL }, (_, i) => startX + (i + 1) * studSpacingPx).filter(x => x < startX + rectW - 4);

  // Joists (if wooden floor)
  const joistSpacingPx = (inputs.floorJoistSpacing / 1000) * scale;
  const joistsCount = Math.floor(rectW / joistSpacingPx);
  const joists = Array.from({ length: joistsCount }, (_, i) => startX + (i + 1) * joistSpacingPx).filter(x => x < startX + rectW - 4);

  // Filter openings for selected wall
  const wallLengthM = (selectedWall === 'front' || selectedWall === 'back') ? inputs.length : inputs.width;
  const wallOpenings = inputs.openings.filter(o => o.wall === selectedWall);

  // Wall heights
  const isUneven = inputs.roofType === 'mono' && inputs.isUnevenWalls;
  const hLow = isUneven ? Math.min(inputs.wallHeight, inputs.wallHeightHigh) : inputs.wallHeight;
  const hHigh = isUneven ? Math.max(inputs.wallHeight, inputs.wallHeightHigh) : inputs.wallHeight;
  const deltaH = (hHigh - hLow).toFixed(2);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">
            Інтерактивна схема конструктиву
          </h3>
        </div>
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('plan')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'plan' ? 'bg-amber-500 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            План (згори)
          </button>
          <button
            onClick={() => setViewMode('wall')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'wall' ? 'bg-amber-500 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Розгортка стіни
          </button>
          <button
            onClick={() => setViewMode('roof')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'roof' ? 'bg-amber-500 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Переріз ({isUneven ? 'Перепад висот' : 'Крокви'})
          </button>
        </div>
      </div>

      {/* Wall selector if in 'wall' view */}
      {viewMode === 'wall' && (
        <div className="flex items-center gap-2 mb-3 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 ml-1 text-[11px]">Оберіть стіну:</span>
          {[
            { id: 'front', label: `Фасад (${inputs.length}м)` },
            { id: 'back', label: `Задня (${inputs.length}м)` },
            { id: 'left', label: `Ліва (${inputs.width}м)` },
            { id: 'right', label: `Права (${inputs.width}м)` },
          ].map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWall(w.id as WallSide)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedWall === w.id
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      )}

      {/* SVG Canvas with 2x hover zoom wrapper */}
      <div
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        className="w-full bg-slate-950/90 rounded-xl border border-slate-800/80 p-2 flex items-center justify-center relative overflow-hidden cursor-crosshair select-none min-h-[360px]"
      >
        {/* Zoom badge indicator */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur border border-slate-700/80 px-2.5 py-1 rounded-lg text-[11px] shadow-lg pointer-events-none transition-all">
          <ZoomIn className={`w-3.5 h-3.5 ${isZoomed ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className={isZoomed ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
            {isZoomed ? '2× Збільшення (перегляд)' : 'Наведіть курсор для 2× збільшення'}
          </span>
        </div>

        {/* Scalable content wrapper (display only, strictly pointer-events-none) */}
        <div
          className="w-full h-full flex items-center justify-center pointer-events-none select-none transition-transform duration-100 ease-out will-change-transform"
          style={{
            transform: isZoomed ? 'scale(2)' : 'scale(1)',
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
          }}
        >
          {/* VIEW 1: TOP-DOWN PLAN */}
          {viewMode === 'plan' && (
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto max-h-[350px]">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

              {/* Diagonal line */}
              <line
                x1={startX}
                y1={startY}
                x2={startX + rectW}
                y2={startY + rectH}
                stroke="#f59e0b"
                strokeDasharray="4,4"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <text
                x={startX + rectW / 2}
                y={startY + rectH / 2 - 8}
                fill="#fbbf24"
                fontSize="11"
                fontFamily="monospace"
                textAnchor="middle"
                className="font-bold select-none"
              >
                Діагональ: {diagonal.toFixed(2)} м
              </text>

              {/* Floor Joists */}
              {inputs.floorType === 'wooden' && (
                <g opacity="0.35">
                  {joists.map((jx, idx) => (
                    <line key={idx} x1={jx} y1={startY} x2={jx} y2={startY + rectH} stroke="#38bdf8" strokeWidth="1.5" />
                  ))}
                </g>
              )}

              {/* Outer Wall Boundary */}
              <rect
                x={startX}
                y={startY}
                width={rectW}
                height={rectH}
                fill="rgba(197, 127, 80, 0.08)"
                stroke="#c57f50"
                strokeWidth="4"
                rx="1"
              />

              {/* Stud marks (omitted inside door/window openings) */}
              {studsL.map((sx, idx) => {
                const xPosM = (sx - startX) / scale;
                const isInsideBackOp = inputs.openings.some(
                  (o) => o.wall === 'back' && xPosM >= o.offsetFromCorner - 0.05 && xPosM <= o.offsetFromCorner + o.width + 0.05
                );
                const isInsideFrontOp = inputs.openings.some(
                  (o) => o.wall === 'front' && xPosM >= o.offsetFromCorner - 0.05 && xPosM <= o.offsetFromCorner + o.width + 0.05
                );

                return (
                  <React.Fragment key={idx}>
                    {!isInsideBackOp && (
                      <rect x={sx - 1.5} y={startY - 1} width="3" height="6" fill="#fbbf24" />
                    )}
                    {!isInsideFrontOp && (
                      <rect x={sx - 1.5} y={startY + rectH - 5} width="3" height="6" fill="#fbbf24" />
                    )}
                  </React.Fragment>
                );
              })}

              {/* Corner Posts */}
              {[
                [startX, startY],
                [startX + rectW - 6, startY],
                [startX, startY + rectH - 6],
                [startX + rectW - 6, startY + rectH - 6],
              ].map(([cx, cy], i) => (
                <rect key={i} x={cx} y={cy} width="6" height="6" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
              ))}

              {/* Render all Openings on actual walls with Dimensions & Nearest Corner Distances */}
              {inputs.openings.map((op) => {
                if (op.wall === 'front') {
                  const ox = startX + op.offsetFromCorner * scale;
                  const ow = Math.min(op.width * scale, rectW);
                  const distL = Number(op.offsetFromCorner.toFixed(2));
                  const distR = Number(Math.max(0, inputs.length - (op.offsetFromCorner + op.width)).toFixed(2));
                  const isNearLeft = distL <= distR;
                  const nearDist = isNearLeft ? distL : distR;
                  const nearCornerX = isNearLeft ? startX : startX + rectW;
                  const edgeX = isNearLeft ? ox : ox + ow;
                  const midX = ox + ow / 2;

                  return (
                    <g key={op.id}>
                      {/* Opening cut */}
                      <rect x={ox} y={startY + rectH - 4} width={ow} height="6" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                      
                      {/* Nearest corner dimension tie-line */}
                      <line
                        x1={Math.min(nearCornerX, edgeX)}
                        y1={startY + rectH + 9}
                        x2={Math.max(nearCornerX, edgeX)}
                        y2={startY + rectH + 9}
                        stroke="#fbbf24"
                        strokeWidth="1.2"
                        strokeDasharray="3,2"
                      />
                      <line x1={nearCornerX} y1={startY + rectH + 6} x2={nearCornerX} y2={startY + rectH + 12} stroke="#fbbf24" strokeWidth="1.2" />
                      <line x1={edgeX} y1={startY + rectH + 6} x2={edgeX} y2={startY + rectH + 12} stroke="#fbbf24" strokeWidth="1.2" />

                      {/* Dimension Badge */}
                      <rect x={midX - 68} y={startY + rectH + 14} width="136" height="22" rx="3" fill="#090d16" stroke="#334155" opacity="0.95" />
                      <text x={midX} y={startY + rectH + 24} fill="#f8fafc" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        {op.name} ({op.width}×{op.height}м)
                      </text>
                      <text x={midX} y={startY + rectH + 33} fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="middle">
                        ⇥ До {isNearLeft ? 'лів.' : 'прав.'} кута: {nearDist}м
                      </text>
                    </g>
                  );
                } else if (op.wall === 'back') {
                  const ox = startX + op.offsetFromCorner * scale;
                  const ow = Math.min(op.width * scale, rectW);
                  const distL = Number(op.offsetFromCorner.toFixed(2));
                  const distR = Number(Math.max(0, inputs.length - (op.offsetFromCorner + op.width)).toFixed(2));
                  const isNearLeft = distL <= distR;
                  const nearDist = isNearLeft ? distL : distR;
                  const nearCornerX = isNearLeft ? startX : startX + rectW;
                  const edgeX = isNearLeft ? ox : ox + ow;
                  const midX = ox + ow / 2;

                  return (
                    <g key={op.id}>
                      {/* Opening cut */}
                      <rect x={ox} y={startY - 2} width={ow} height="6" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                      
                      {/* Nearest corner dimension tie-line */}
                      <line
                        x1={Math.min(nearCornerX, edgeX)}
                        y1={startY - 9}
                        x2={Math.max(nearCornerX, edgeX)}
                        y2={startY - 9}
                        stroke="#fbbf24"
                        strokeWidth="1.2"
                        strokeDasharray="3,2"
                      />
                      <line x1={nearCornerX} y1={startY - 12} x2={nearCornerX} y2={startY - 6} stroke="#fbbf24" strokeWidth="1.2" />
                      <line x1={edgeX} y1={startY - 12} x2={edgeX} y2={startY - 6} stroke="#fbbf24" strokeWidth="1.2" />

                      {/* Dimension Badge */}
                      <rect x={midX - 68} y={startY - 37} width="136" height="22" rx="3" fill="#090d16" stroke="#334155" opacity="0.95" />
                      <text x={midX} y={startY - 27} fill="#f8fafc" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        {op.name} ({op.width}×{op.height}м)
                      </text>
                      <text x={midX} y={startY - 18} fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="middle">
                        ⇥ До {isNearLeft ? 'лів.' : 'прав.'} кута: {nearDist}м
                      </text>
                    </g>
                  );
                } else if (op.wall === 'left') {
                  const oy = startY + op.offsetFromCorner * scale;
                  const oh = Math.min(op.width * scale, rectH);
                  const distTop = Number(op.offsetFromCorner.toFixed(2));
                  const distBottom = Number(Math.max(0, inputs.width - (op.offsetFromCorner + op.width)).toFixed(2));
                  const isNearTop = distTop <= distBottom;
                  const nearDist = isNearTop ? distTop : distBottom;
                  const nearCornerY = isNearTop ? startY : startY + rectH;
                  const edgeY = isNearTop ? oy : oy + oh;
                  const midY = oy + oh / 2;

                  return (
                    <g key={op.id}>
                      <rect x={startX - 2} y={oy} width="6" height={oh} fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                      
                      {/* Nearest corner dimension tie-line */}
                      <line
                        x1={startX - 9}
                        y1={Math.min(nearCornerY, edgeY)}
                        x2={startX - 9}
                        y2={Math.max(nearCornerY, edgeY)}
                        stroke="#fbbf24"
                        strokeWidth="1.2"
                        strokeDasharray="3,2"
                      />
                      <line x1={startX - 12} y1={nearCornerY} x2={startX - 6} y2={nearCornerY} stroke="#fbbf24" strokeWidth="1.2" />
                      <line x1={startX - 12} y1={edgeY} x2={startX - 6} y2={edgeY} stroke="#fbbf24" strokeWidth="1.2" />

                      {/* Dimension Badge */}
                      <rect x={startX - 146} y={midY - 11} width="134" height="22" rx="3" fill="#090d16" stroke="#334155" opacity="0.95" />
                      <text x={startX - 79} y={midY - 1} fill="#f8fafc" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        {op.name} ({op.width}×{op.height}м)
                      </text>
                      <text x={startX - 79} y={midY + 8} fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="middle">
                        До кута: {nearDist}м
                      </text>
                    </g>
                  );
                } else if (op.wall === 'right') {
                  const oy = startY + op.offsetFromCorner * scale;
                  const oh = Math.min(op.width * scale, rectH);
                  const distTop = Number(op.offsetFromCorner.toFixed(2));
                  const distBottom = Number(Math.max(0, inputs.width - (op.offsetFromCorner + op.width)).toFixed(2));
                  const isNearTop = distTop <= distBottom;
                  const nearDist = isNearTop ? distTop : distBottom;
                  const nearCornerY = isNearTop ? startY : startY + rectH;
                  const edgeY = isNearTop ? oy : oy + oh;
                  const midY = oy + oh / 2;

                  return (
                    <g key={op.id}>
                      <rect x={startX + rectW - 4} y={oy} width="6" height={oh} fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                      
                      {/* Nearest corner dimension tie-line */}
                      <line
                        x1={startX + rectW + 9}
                        y1={Math.min(nearCornerY, edgeY)}
                        x2={startX + rectW + 9}
                        y2={Math.max(nearCornerY, edgeY)}
                        stroke="#fbbf24"
                        strokeWidth="1.2"
                        strokeDasharray="3,2"
                      />
                      <line x1={startX + rectW + 6} y1={nearCornerY} x2={startX + rectW + 12} y2={nearCornerY} stroke="#fbbf24" strokeWidth="1.2" />
                      <line x1={startX + rectW + 6} y1={edgeY} x2={startX + rectW + 12} y2={edgeY} stroke="#fbbf24" strokeWidth="1.2" />

                      {/* Dimension Badge */}
                      <rect x={startX + rectW + 12} y={midY - 11} width="134" height="22" rx="3" fill="#090d16" stroke="#334155" opacity="0.95" />
                      <text x={startX + rectW + 79} y={midY - 1} fill="#f8fafc" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        {op.name} ({op.width}×{op.height}м)
                      </text>
                      <text x={startX + rectW + 79} y={midY + 8} fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="middle">
                        До кута: {nearDist}м
                      </text>
                    </g>
                  );
                }
                return null;
              })}

              {/* Building Dimension Lines */}
              <line x1={startX} y1={startY - 44} x2={startX + rectW} y2={startY - 44} stroke="#94a3b8" strokeWidth="1" />
              <line x1={startX} y1={startY - 48} x2={startX} y2={startY - 40} stroke="#94a3b8" strokeWidth="1" />
              <line x1={startX + rectW} y1={startY - 48} x2={startX + rectW} y2={startY - 40} stroke="#94a3b8" strokeWidth="1" />
              <text x={startX + rectW / 2} y={startY - 48} fill="#e2e8f0" fontSize="11" fontFamily="monospace" textAnchor="middle">
                Довжина: {inputs.length.toFixed(1)} м
              </text>

              <line x1={startX - 150} y1={startY} x2={startX - 150} y2={startY + rectH} stroke="#94a3b8" strokeWidth="1" />
              <line x1={startX - 154} y1={startY} x2={startX - 146} y2={startY} stroke="#94a3b8" strokeWidth="1" />
              <line x1={startX - 154} y1={startY + rectH} x2={startX - 146} y2={startY + rectH} stroke="#94a3b8" strokeWidth="1" />
              <text
                x={startX - 156}
                y={startY + rectH / 2}
                fill="#e2e8f0"
                fontSize="11"
                fontFamily="monospace"
                textAnchor="middle"
                transform={`rotate(-90 ${startX - 156} ${startY + rectH / 2})`}
              >
                Ширина: {inputs.width.toFixed(1)} м
              </text>
            </svg>
          )}

        {/* VIEW 2: WALL ELEVATION & FRAMING DETAIL */}
        {viewMode === 'wall' && (
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto max-h-[340px]">
            <rect width={svgWidth} height={svgHeight} fill="#090d16" />

            {(() => {
              const wallPaddingX = 40;
              const wallPaddingY = 50;
              const wAvailWidth = svgWidth - 2 * wallPaddingX;
              const wAvailHeight = svgHeight - 2 * wallPaddingY - 20;

              // Check if selected wall is a rake wall (slope wall)
              const isSideRakeWall = isUneven && (
                (inputs.highWallSide === 'front' || inputs.highWallSide === 'back')
                  ? (selectedWall === 'left' || selectedWall === 'right')
                  : (selectedWall === 'front' || selectedWall === 'back')
              );

              // Determine current wall heights
              let currentWallHLeft = inputs.wallHeight;
              let currentWallHRight = inputs.wallHeight;

              if (isUneven) {
                if (isSideRakeWall) {
                  currentWallHLeft = inputs.highWallSide === 'front' ? hHigh : hLow;
                  currentWallHRight = inputs.highWallSide === 'front' ? hLow : hHigh;
                } else {
                  const isThisHighWall = selectedWall === inputs.highWallSide;
                  currentWallHLeft = isThisHighWall ? hHigh : hLow;
                  currentWallHRight = isThisHighWall ? hHigh : hLow;
                }
              }

              const maxWallH = Math.max(currentWallHLeft, currentWallHRight);
              const wScale = Math.min(wAvailWidth / wallLengthM, wAvailHeight / maxWallH);
              const wPixelWidth = wallLengthM * wScale;
              
              const wStartX = (svgWidth - wPixelWidth) / 2;
              const wFloorY = svgHeight - wallPaddingY;
              
              const hLeftPx = currentWallHLeft * wScale;
              const hRightPx = currentWallHRight * wScale;

              const studStepPx = (inputs.studSpacing / 1000) * wScale;
              const countStuds = Math.floor(wPixelWidth / studStepPx);
              const studXPositions = Array.from({ length: countStuds }, (_, i) => wStartX + (i + 1) * studStepPx);

              return (
                <g>
                  {/* Ground reference */}
                  <line x1="20" y1={wFloorY + 12} x2={svgWidth - 20} y2={wFloorY + 12} stroke="#334155" strokeWidth="1" strokeDasharray="4,4" />
                  <text x="30" y={wFloorY + 24} fill="#64748b" fontSize="9" fontFamily="monospace">
                    Рівень підлоги (±0.000)
                  </text>

                  {/* 1. BOTTOM PLATE */}
                  <rect x={wStartX} y={wFloorY - 6} width={wPixelWidth} height="6" fill="#d97706" stroke="#92400e" strokeWidth="1" />

                  {/* 2. TOP PLATE (Straight or Rake) */}
                  <line
                    x1={wStartX}
                    y1={wFloorY - hLeftPx}
                    x2={wStartX + wPixelWidth}
                    y2={wFloorY - hRightPx}
                    stroke="#f59e0b"
                    strokeWidth="8"
                  />
                  <line
                    x1={wStartX}
                    y1={wFloorY - hLeftPx - 5}
                    x2={wStartX + wPixelWidth}
                    y2={wFloorY - hRightPx - 5}
                    stroke="#b45309"
                    strokeWidth="3"
                  />

                  {/* 3. STUDS (WITH OPENING INTERRUPTION / CRIPPLE CONVERSION) */}
                  {studXPositions.map((sx, idx) => {
                    const ratio = (sx - wStartX) / wPixelWidth;
                    const studH = hLeftPx + ratio * (hRightPx - hLeftPx);

                    // Check if sx falls inside any opening on this wall
                    const overlappingOp = wallOpenings.find((op) => {
                      const opLeftX = wStartX + op.offsetFromCorner * wScale;
                      const opRightX = opLeftX + op.width * wScale;
                      return sx >= opLeftX - 3 && sx <= opRightX + 3;
                    });

                    if (overlappingOp) {
                      // This stud is INTERRUPTED by the opening: only draw cripples!
                      const opBottomY = wFloorY - (overlappingOp.bottomOffset * wScale) - 6;
                      const opTopY = opBottomY - (overlappingOp.height * wScale);
                      const headerHeightPx = Math.max(12, (inputs.studWidth / 1000) * wScale * 0.9);

                      return (
                        <g key={idx}>
                          {/* Top Cripple Stud above header */}
                          <line
                            x1={sx}
                            y1={wFloorY - studH + 6}
                            x2={sx}
                            y2={opTopY - headerHeightPx}
                            stroke="#eab308"
                            strokeWidth="2.5"
                          />
                          {/* Bottom Cripple Stud below sill */}
                          {overlappingOp.bottomOffset > 0 && (
                            <line
                              x1={sx}
                              y1={opBottomY + 5}
                              x2={sx}
                              y2={wFloorY - 6}
                              stroke="#eab308"
                              strokeWidth="2.5"
                            />
                          )}
                        </g>
                      );
                    }

                    // Check if stud is adjacent to a King stud (within 10px) to avoid visual clash
                    const isNearKingStud = wallOpenings.some((op) => {
                      const opLeftX = wStartX + op.offsetFromCorner * wScale;
                      const opRightX = opLeftX + op.width * wScale;
                      return Math.abs(sx - (opLeftX - 6)) < 8 || Math.abs(sx - (opRightX + 6)) < 8;
                    });

                    if (isNearKingStud) {
                      return null;
                    }

                    // Regular full-height stud
                    return (
                      <line
                        key={idx}
                        x1={sx}
                        y1={wFloorY - studH + 6}
                        x2={sx}
                        y2={wFloorY - 6}
                        stroke="#475569"
                        strokeWidth="2.5"
                      />
                    );
                  })}

                  {/* Corner Posts */}
                  <line x1={wStartX + 2} y1={wFloorY - hLeftPx + 6} x2={wStartX + 2} y2={wFloorY - 6} stroke="#f59e0b" strokeWidth="5" />
                  <line x1={wStartX + wPixelWidth - 2} y1={wFloorY - hRightPx + 6} x2={wStartX + wPixelWidth - 2} y2={wFloorY - 6} stroke="#f59e0b" strokeWidth="5" />

                  {/* 4. OPENINGS WITH DIMENSIONS & NEAREST CORNER DISTANCE */}
                  {wallOpenings.map((op) => {
                    const opLeftX = wStartX + op.offsetFromCorner * wScale;
                    const opWidthPx = op.width * wScale;
                    const opRightX = opLeftX + opWidthPx;
                    
                    const opBottomY = wFloorY - (op.bottomOffset * wScale) - 6;
                    const opTopY = opBottomY - (op.height * wScale);
                    const headerHeightPx = Math.max(12, (inputs.studWidth / 1000) * wScale * 0.9);

                    // Height of wall at opening center
                    const ratio = (opLeftX + opWidthPx / 2 - wStartX) / wPixelWidth;
                    const wallHAtOp = hLeftPx + ratio * (hRightPx - hLeftPx);

                    // Nearest Corner Calculations
                    const distLeft = Number(op.offsetFromCorner.toFixed(2));
                    const distRight = Number(Math.max(0, wallLengthM - (op.offsetFromCorner + op.width)).toFixed(2));
                    const isLeftNearest = distLeft <= distRight;
                    const nearestDist = isLeftNearest ? distLeft : distRight;
                    const nearestCornerLabel = isLeftNearest ? 'лів. кута' : 'прав. кута';
                    const nearestCornerX = isLeftNearest ? wStartX : wStartX + wPixelWidth;
                    const openingEdgeX = isLeftNearest ? opLeftX : opRightX;

                    // Dimension positions
                    const dimWidthY = Math.max(16, opTopY - headerHeightPx - 8);
                    const dimHeightX = Math.min(svgWidth - 14, opRightX + 14);

                    return (
                      <g key={op.id}>
                        {/* King Studs */}
                        <line x1={opLeftX - 6} y1={wFloorY - wallHAtOp + 8} x2={opLeftX - 6} y2={wFloorY - 6} stroke="#3b82f6" strokeWidth="4" />
                        <line x1={opRightX + 6} y1={wFloorY - wallHAtOp + 8} x2={opRightX + 6} y2={wFloorY - 6} stroke="#3b82f6" strokeWidth="4" />

                        {/* Jack Studs */}
                        <line x1={opLeftX - 2} y1={opTopY} x2={opLeftX - 2} y2={wFloorY - 6} stroke="#f97316" strokeWidth="4" />
                        <line x1={opRightX + 2} y1={opTopY} x2={opRightX + 2} y2={wFloorY - 6} stroke="#f97316" strokeWidth="4" />

                        {/* Header */}
                        <rect
                          x={opLeftX - 4}
                          y={opTopY - headerHeightPx}
                          width={opWidthPx + 8}
                          height={headerHeightPx}
                          fill="#ef4444"
                          stroke="#991b1b"
                          strokeWidth="1.5"
                        />
                        <text
                          x={opLeftX + opWidthPx / 2}
                          y={opTopY - headerHeightPx / 2 + 3}
                          fill="#ffffff"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="middle"
                          className="font-bold"
                        >
                          ХЕДЕР
                        </text>

                        {/* Rough Sill */}
                        {op.bottomOffset > 0 && (
                          <rect x={opLeftX} y={opBottomY} width={opWidthPx} height="5" fill="#10b981" />
                        )}

                        {/* Opening Void Highlight */}
                        <rect
                          x={opLeftX}
                          y={opTopY}
                          width={opWidthPx}
                          height={opBottomY - opTopY}
                          fill="rgba(56, 189, 248, 0.12)"
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          strokeDasharray="4,2"
                        />

                        {/* In-Void Information Block */}
                        <g>
                          <rect
                            x={opLeftX + 4}
                            y={opTopY + (opBottomY - opTopY) / 2 - 20}
                            width={Math.max(10, opWidthPx - 8)}
                            height="40"
                            rx="3"
                            fill="#090d16"
                            fillOpacity="0.8"
                            stroke="#334155"
                            strokeWidth="0.8"
                          />
                          <text
                            x={opLeftX + opWidthPx / 2}
                            y={opTopY + (opBottomY - opTopY) / 2 - 7}
                            fill="#ffffff"
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                            fontWeight="bold"
                          >
                            {op.name}
                          </text>
                          <text
                            x={opLeftX + opWidthPx / 2}
                            y={opTopY + (opBottomY - opTopY) / 2 + 5}
                            fill="#38bdf8"
                            fontSize="8.5"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {op.width} × {op.height} м
                          </text>
                          <text
                            x={opLeftX + opWidthPx / 2}
                            y={opTopY + (opBottomY - opTopY) / 2 + 15}
                            fill="#fbbf24"
                            fontSize="8"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            До кута: {nearestDist} м
                          </text>
                        </g>

                        {/* Width Dimension Line (above header) */}
                        <g>
                          <line x1={opLeftX} y1={dimWidthY} x2={opRightX} y2={dimWidthY} stroke="#38bdf8" strokeWidth="1.2" />
                          <line x1={opLeftX - 3} y1={dimWidthY + 3} x2={opLeftX + 3} y2={dimWidthY - 3} stroke="#38bdf8" strokeWidth="1.2" />
                          <line x1={opRightX - 3} y1={dimWidthY + 3} x2={opRightX + 3} y2={dimWidthY - 3} stroke="#38bdf8" strokeWidth="1.2" />
                          <line x1={opLeftX} y1={dimWidthY - 2} x2={opLeftX} y2={opTopY - headerHeightPx} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.6" />
                          <line x1={opRightX} y1={dimWidthY - 2} x2={opRightX} y2={opTopY - headerHeightPx} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.6" />
                          <rect x={opLeftX + opWidthPx / 2 - 28} y={dimWidthY - 9} width="56" height="11" rx="2" fill="#090d16" fillOpacity="0.9" />
                          <text x={opLeftX + opWidthPx / 2} y={dimWidthY - 1} fill="#38bdf8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                            Ш: {op.width}м
                          </text>
                        </g>

                        {/* Height Dimension Line (right of opening) */}
                        <g>
                          <line x1={dimHeightX} y1={opTopY} x2={dimHeightX} y2={opBottomY} stroke="#38bdf8" strokeWidth="1.2" />
                          <line x1={dimHeightX - 3} y1={opTopY + 3} x2={dimHeightX + 3} y2={opTopY - 3} stroke="#38bdf8" strokeWidth="1.2" />
                          <line x1={dimHeightX - 3} y1={opBottomY + 3} x2={dimHeightX + 3} y2={opBottomY - 3} stroke="#38bdf8" strokeWidth="1.2" />
                          <line x1={opRightX + 2} y1={opTopY} x2={dimHeightX + 3} y2={opTopY} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.6" />
                          <line x1={opRightX + 2} y1={opBottomY} x2={dimHeightX + 3} y2={opBottomY} stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.6" />
                          <rect x={dimHeightX + 4} y={(opTopY + opBottomY) / 2 - 6} width="50" height="12" rx="2" fill="#090d16" fillOpacity="0.9" />
                          <text x={dimHeightX + 6} y={(opTopY + opBottomY) / 2 + 3} fill="#38bdf8" fontSize="8.5" fontFamily="monospace" textAnchor="start" fontWeight="bold">
                            В: {op.height}м
                          </text>
                        </g>

                        {/* Nearest Corner Dimension Line */}
                        <g>
                          <line
                            x1={Math.min(nearestCornerX, openingEdgeX)}
                            y1={wFloorY + 12}
                            x2={Math.max(nearestCornerX, openingEdgeX)}
                            y2={wFloorY + 12}
                            stroke="#fbbf24"
                            strokeWidth="1.3"
                          />
                          <line
                            x1={Math.min(nearestCornerX, openingEdgeX) - 3}
                            y1={wFloorY + 12 + 3}
                            x2={Math.min(nearestCornerX, openingEdgeX) + 3}
                            y2={wFloorY + 12 - 3}
                            stroke="#fbbf24"
                            strokeWidth="1.3"
                          />
                          <line
                            x1={Math.max(nearestCornerX, openingEdgeX) - 3}
                            y1={wFloorY + 12 + 3}
                            x2={Math.max(nearestCornerX, openingEdgeX) + 3}
                            y2={wFloorY + 12 - 3}
                            stroke="#fbbf24"
                            strokeWidth="1.3"
                          />
                          <rect
                            x={(nearestCornerX + openingEdgeX) / 2 - 58}
                            y={wFloorY + 6}
                            width="116"
                            height="12"
                            rx="2"
                            fill="#090d16"
                            fillOpacity="0.95"
                          />
                          <text
                            x={(nearestCornerX + openingEdgeX) / 2}
                            y={wFloorY + 15}
                            fill="#fbbf24"
                            fontSize="8.5"
                            fontFamily="monospace"
                            textAnchor="middle"
                            fontWeight="bold"
                          >
                            ⇥ До {nearestCornerLabel}: {nearestDist}м
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Height markers */}
                  <text x={wStartX - 10} y={wFloorY - hLeftPx / 2} fill="#cbd5e1" fontSize="10" fontFamily="monospace" textAnchor="end">
                    {currentWallHLeft.toFixed(2)} м
                  </text>
                  {isSideRakeWall && (
                    <text x={wStartX + wPixelWidth + 10} y={wFloorY - hRightPx / 2} fill="#cbd5e1" fontSize="10" fontFamily="monospace" textAnchor="start">
                      {currentWallHRight.toFixed(2)} м
                    </text>
                  )}

                  {/* Length Dimension */}
                  <line x1={wStartX} y1={wFloorY + 28} x2={wStartX + wPixelWidth} y2={wFloorY + 28} stroke="#94a3b8" strokeWidth="1" />
                  <line x1={wStartX} y1={wFloorY + 24} x2={wStartX} y2={wFloorY + 32} stroke="#94a3b8" strokeWidth="1" />
                  <line x1={wStartX + wPixelWidth} y1={wFloorY + 24} x2={wStartX + wPixelWidth} y2={wFloorY + 32} stroke="#94a3b8" strokeWidth="1" />
                  <text x={wStartX + wPixelWidth / 2} y={wFloorY + 40} fill="#e2e8f0" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    Довжина стіни: {wallLengthM} м {isSideRakeWall && `(Коса стіна: перепад ${(Math.abs(currentWallHLeft - currentWallHRight) * 100).toFixed(0)} см)`}
                  </text>
                </g>
              );
            })()}
          </svg>
        )}

        {/* VIEW 3: ROOF PROFILE & UNEVEN WALLS */}
        {viewMode === 'roof' && (
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto max-h-[340px]">
            <rect width={svgWidth} height={svgHeight} fill="#090d16" />
            <line x1="20" y1="310" x2={svgWidth - 20} y2="310" stroke="#334155" strokeWidth="2" strokeDasharray="6,4" />
            <text x="35" y="325" fill="#64748b" fontSize="9" fontFamily="monospace">Рівень фундаменту (±0.000)</text>

            {(() => {
              const bW = 280;
              const bX = (svgWidth - bW) / 2;

              if (inputs.roofType === 'mono') {
                // UNEVEN WALLS OR REGULAR MONO
                const lowWallH = isUneven ? (hLow / 2.8) * 100 : 90;
                const highWallH = isUneven ? (hHigh / 2.8) * 100 : 130;
                
                const leftWallH = inputs.highWallSide === 'back' ? highWallH : lowWallH;
                const rightWallH = inputs.highWallSide === 'back' ? lowWallH : highWallH;

                const leftY = 310 - leftWallH;
                const rightY = 310 - rightWallH;

                return (
                  <g>
                    {/* Left Wall */}
                    <rect x={bX} y={leftY} width="12" height={leftWallH} fill="#b76a44" stroke="#78350f" />
                    {/* Right Wall */}
                    <rect x={bX + bW - 12} y={rightY} width="12" height={rightWallH} fill="#b76a44" stroke="#78350f" />

                    {/* Double Top Plates on both walls */}
                    <rect x={bX - 2} y={leftY - 4} width="16" height="4" fill="#fbbf24" />
                    <rect x={bX + bW - 14} y={rightY - 4} width="16" height="4" fill="#fbbf24" />

                    {/* Slanted Rafter spanning both walls */}
                    <line
                      x1={bX - 25}
                      y1={leftY - (leftY < rightY ? 8 : -8)}
                      x2={bX + bW + 25}
                      y2={rightY - (rightY < leftY ? 8 : -8)}
                      stroke="#f59e0b"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />

                    {/* Left wall height dimension */}
                    <line x1={bX - 15} y1={leftY} x2={bX - 15} y2={310} stroke="#38bdf8" strokeWidth="1" />
                    <text x={bX - 20} y={leftY + leftWallH / 2} fill="#38bdf8" fontSize="11" fontFamily="monospace" textAnchor="end" className="font-bold">
                      {inputs.highWallSide === 'back' ? hHigh : hLow} м ({( (inputs.highWallSide === 'back' ? hHigh : hLow) * 100).toFixed(0)} см)
                    </text>

                    {/* Right wall height dimension */}
                    <line x1={bX + bW + 15} y1={rightY} x2={bX + bW + 15} y2={310} stroke="#38bdf8" strokeWidth="1" />
                    <text x={bX + bW + 20} y={rightY + rightWallH / 2} fill="#38bdf8" fontSize="11" fontFamily="monospace" textAnchor="start" className="font-bold">
                      {inputs.highWallSide === 'back' ? hLow : hHigh} м ({( (inputs.highWallSide === 'back' ? hLow : hHigh) * 100).toFixed(0)} см)
                    </text>

                    {/* Delta H indicator */}
                    <line x1={bX} y1={Math.min(leftY, rightY)} x2={bX + bW} y2={Math.min(leftY, rightY)} stroke="#64748b" strokeDasharray="3,3" />
                    <text x={bX + bW / 2} y={Math.min(leftY, rightY) - 15} fill="#fbbf24" fontSize="11" fontFamily="monospace" textAnchor="middle" className="font-bold">
                      Перепад висот: ΔH = {deltaH} м ({((parseFloat(deltaH)) * 100).toFixed(0)} см)
                    </text>

                    {/* Ground distance */}
                    <text x={bX + bW / 2} y={325} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      Проліт покрівлі: {inputs.width} м
                    </text>
                  </g>
                );
              } else {
                // Gable pitch
                const bH = 100;
                const bY = 310 - bH;
                const rad = (inputs.roofPitchAngle * Math.PI) / 180;
                const roofApexH = Math.min(Math.max((Math.tan(rad) * (bW / 2)) * 0.4, 30), 120);

                return (
                  <g>
                    <rect x={bX} y={bY} width="10" height={bH} fill="#b76a44" stroke="#78350f" />
                    <rect x={bX + bW - 10} y={bY} width="10" height={bH} fill="#b76a44" stroke="#78350f" />
                    
                    <line x1={bX - 20} y1={bY + 8} x2={bX + bW / 2} y2={bY - roofApexH} stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                    <line x1={bX + bW + 20} y1={bY + 8} x2={bX + bW / 2} y2={bY - roofApexH} stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                    
                    <line x1={bX + 40} y1={bY - roofApexH * 0.45} x2={bX + bW - 40} y2={bY - roofApexH * 0.45} stroke="#38bdf8" strokeWidth="3" />
                    <text x={bX + bW / 2} y={bY - roofApexH * 0.45 - 5} fill="#7dd3fc" fontSize="9" fontFamily="monospace" textAnchor="middle">
                      Затяжка (Collar tie)
                    </text>
                    <text x={bX + bW / 2} y={bY - roofApexH - 12} fill="#fbbf24" fontSize="11" fontFamily="monospace" textAnchor="middle">
                      Двоскатний кут: {inputs.roofPitchAngle}°
                    </text>
                  </g>
                );
              }
            })()}
          </svg>
        )}
        </div>
      </div>

      {/* Legend & Dimensions Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2.5 h-1.5 bg-sky-400 rounded-sm"></span> Габарити прорізів (Ш × В)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400 font-medium">
            <span className="w-2.5 h-1.5 bg-amber-400 rounded-sm"></span> Відстань від найближчого кута
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <ZoomIn className="w-3.5 h-3.5 text-amber-400" /> Наведення: 2× збільшення (перегляд без редагування)
          </span>
        </div>
        <div className="text-slate-500 font-mono text-[10px]">
          Діагональ: {diagonal.toFixed(2)} м
        </div>
      </div>

      {/* Legend for Wall Framing */}
      {viewMode === 'wall' && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[11px] bg-slate-950 p-2 rounded-xl border border-slate-800">
          <span className="flex items-center gap-1 text-blue-400">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> King Stud (цільна)
          </span>
          <span className="flex items-center gap-1 text-orange-400">
            <span className="w-2.5 h-2.5 bg-orange-500 rounded-sm"></span> Jack Stud (підстійка)
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-sm"></span> Хедер на ребро
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> Підвіконня (Sill)
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-sm"></span> Коротиші (Cripples)
          </span>
        </div>
      )}

      {viewMode !== 'wall' && (
        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Крок стійок: {inputs.studSpacing} мм
          </span>
          {isUneven && (
            <span className="flex items-center gap-1.5 text-amber-300 font-mono">
              Перепад стін: {deltaH} м ({((parseFloat(deltaH)) * 100).toFixed(0)} см)
            </span>
          )}
        </div>
      )}
    </div>
  );
};
