import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pencil,
  Eraser,
  RotateCcw,
  Trash2,
  Minimize2,
  X,
  Grid,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export type ScratchpadTool = 'pen' | 'eraser';
export type ScratchpadBackgroundMode = 'translucent' | 'chalkboard' | 'grid';

export interface ScratchpadStrokePoint {
  x: number;
  y: number;
}

export interface ScratchpadStroke {
  points: ScratchpadStrokePoint[];
  color: string;
  width: number;
  isEraser: boolean;
}

export interface ScratchpadProps {
  className?: string;
  defaultOpen?: boolean;
}

const COLOR_PALETTE = [
  { name: 'Branco', value: '#ffffff', bgClass: 'bg-white' },
  { name: 'Amarelo', value: '#facc15', bgClass: 'bg-yellow-400' },
  { name: 'Ciano', value: '#38bdf8', bgClass: 'bg-sky-400' },
  { name: 'Verde', value: '#4ade80', bgClass: 'bg-green-400' },
  { name: 'Laranja', value: '#fb923c', bgClass: 'bg-orange-400' },
  { name: 'Rosa', value: '#f43f5e', bgClass: 'bg-rose-500' },
];

const STROKE_WIDTH_OPTIONS = [
  { label: 'Fina', width: 2, dotSize: 'w-1.5 h-1.5' },
  { label: 'Média', width: 4, dotSize: 'w-2.5 h-2.5' },
  { label: 'Grossa', width: 8, dotSize: 'w-4 h-4' },
];

export const Scratchpad: React.FC<ScratchpadProps> = ({
  className = '',
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [tool, setTool] = useState<ScratchpadTool>('pen');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [bgMode, setBgMode] = useState<ScratchpadBackgroundMode>('translucent');
  const [strokesCount, setStrokesCount] = useState(0);
  const [canRestoreClear, setCanRestoreClear] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<ScratchpadStrokePoint | null>(null);
  const currentStrokeRef = useRef<ScratchpadStroke | null>(null);
  const strokesRef = useRef<ScratchpadStroke[]>([]);
  const lastClearedStrokesRef = useRef<ScratchpadStroke[]>([]);

  // Safely notify store of scratchpad usage
  const notifyScratchpadUse = useCallback(() => {
    try {
      const store = useAppStore.getState() as unknown as {
        incrementScratchpadUses?: () => void;
      };
      if (typeof store.incrementScratchpadUses === 'function') {
        store.incrementScratchpadUses();
      }
    } catch {
      // Graceful fallback if store action is not present
    }
  }, []);

  // Sync with global store if isScratchpadOpen is tracked
  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      const storeState = state as unknown as { isScratchpadOpen?: boolean };
      if (typeof storeState.isScratchpadOpen === 'boolean' && storeState.isScratchpadOpen !== isOpen) {
        setIsOpen(storeState.isScratchpadOpen);
      }
    });
    return () => unsub();
  }, [isOpen]);

  // Redraw all strokes from memory onto canvas
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const stroke of strokesRef.current) {
      if (stroke.points.length === 0) continue;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.width;

      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
      }

      ctx.beginPath();
      const first = stroke.points[0];
      ctx.moveTo(first.x, first.y);
      if (stroke.points.length === 1) {
        ctx.lineTo(first.x, first.y);
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  // Adjust canvas size to match container dimensions and DPR
  const initCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const newWidth = Math.floor(rect.width);
    const newHeight = Math.floor(rect.height);

    if (canvas.width !== newWidth * dpr || canvas.height !== newHeight * dpr) {
      canvas.width = newWidth * dpr;
      canvas.height = newHeight * dpr;
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      redrawAll();
    }
  }, [redrawAll]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        notifyScratchpadUse();
      }
      return next;
    });

    try {
      const store = useAppStore.getState() as unknown as {
        toggleScratchpad?: () => void;
      };
      if (typeof store.toggleScratchpad === 'function') {
        store.toggleScratchpad();
      }
    } catch {
      // Graceful fallback
    }
  }, [notifyScratchpadUse]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    try {
      const store = useAppStore.getState() as unknown as {
        isScratchpadOpen?: boolean;
        toggleScratchpad?: () => void;
      };
      if (store.isScratchpadOpen && typeof store.toggleScratchpad === 'function') {
        store.toggleScratchpad();
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  const handleUndo = useCallback(() => {
    // If board was cleared and undo is pressed, restore cleared strokes
    if (strokesRef.current.length === 0 && lastClearedStrokesRef.current.length > 0) {
      strokesRef.current = [...lastClearedStrokesRef.current];
      lastClearedStrokesRef.current = [];
      setCanRestoreClear(false);
      setStrokesCount(strokesRef.current.length);
      redrawAll();
      return;
    }

    if (strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    setStrokesCount(strokesRef.current.length);
    redrawAll();
  }, [redrawAll]);

  const handleClear = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    lastClearedStrokesRef.current = [...strokesRef.current];
    strokesRef.current = [];
    setCanRestoreClear(true);
    setStrokesCount(0);
    redrawAll();
  }, [redrawAll]);

  const cycleBackgroundMode = () => {
    setBgMode((prev) => {
      if (prev === 'translucent') return 'chalkboard';
      if (prev === 'chalkboard') return 'grid';
      return 'translucent';
    });
  };

  // Handle open state changes
  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => {
        initCanvasSize();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen, initCanvasSize]);

  // Observe container resizes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      if (isOpen) {
        initCanvasSize();
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [isOpen, initCanvasSize]);

  // Window resize fallback
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        initCanvasSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, initCanvasSize]);

  // Keyboard shortcuts (Ctrl+Z to Undo, Esc to Minimize)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleUndo, handleClose]);

  // Pointer drawing events
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only primary button

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isEraser = tool === 'eraser';
    const effectiveWidth = isEraser ? strokeWidth * 3.5 : strokeWidth;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = effectiveWidth;

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();

    isDrawingRef.current = true;
    lastPointRef.current = { x, y };
    currentStrokeRef.current = {
      points: [{ x, y }],
      color: selectedColor,
      width: effectiveWidth,
      isEraser,
    };

    notifyScratchpadUse();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current || !currentStrokeRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const prev = lastPointRef.current;
    const dist = Math.hypot(x - prev.x, y - prev.y);
    if (dist < 0.5) return;

    const stroke = currentStrokeRef.current;
    stroke.points.push({ x, y });

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPointRef.current = { x, y };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Fallback
    }

    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      strokesRef.current.push(currentStrokeRef.current);
      currentStrokeRef.current = null;
      setStrokesCount(strokesRef.current.length);
      setCanRestoreClear(false);
      lastClearedStrokesRef.current = [];
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerUp(e);
  };

  // Background overlay styles
  const bgClasses: Record<ScratchpadBackgroundMode, string> = {
    translucent: 'bg-slate-950/80 backdrop-blur-xs text-white',
    chalkboard: 'bg-slate-900 text-white',
    grid: 'bg-slate-950 bg-[radial-gradient(rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:24px_24px] text-white',
  };

  return (
    <>
      {/* 1. Floating Pencil Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isOpen ? 'Minimizar Lousa de Rascunho' : 'Abrir Lousa de Rascunho'}
        title="Lousa de Rascunho (abrir / minimizar)"
        className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center justify-center p-3.5 md:p-4 rounded-full shadow-2xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
          isOpen
            ? 'bg-slate-800 text-amber-400 hover:bg-slate-700 ring-2 ring-amber-400/60 shadow-amber-500/10'
            : 'bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 hover:scale-105 hover:shadow-amber-500/25 active:scale-95'
        } ${className}`}
      >
        <Pencil className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:rotate-12" />
        {strokesCount > 0 && !isOpen && (
          <span
            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-slate-900 animate-pulse"
            title="Rascunho ativo salvo"
          />
        )}
      </button>

      {/* 2. Scratchpad Overlay (kept in DOM with `hidden` when minimized to preserve canvas state) */}
      <div
        className={
          isOpen
            ? `fixed inset-0 z-50 flex flex-col select-none ${bgClasses[bgMode]} transition-colors duration-150`
            : 'hidden'
        }
      >
        {/* Top Control Bar */}
        <header className="flex-shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 py-2 md:px-5 md:py-3 flex flex-wrap items-center justify-between gap-2 shadow-lg">
          {/* Brand / Mode Indicator */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1.5 bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/30 text-xs md:text-sm font-semibold">
              <Pencil className="w-4 h-4" />
              <span>Rascunho Digital</span>
            </div>

            {/* Tool Switcher (Pen / Eraser) */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setTool('pen')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  tool === 'pen'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Caneta livre"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Caneta</span>
              </button>
              <button
                type="button"
                onClick={() => setTool('eraser')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  tool === 'eraser'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Borracha (apagar traços)"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Borracha</span>
              </button>
            </div>
          </div>

          {/* Color Palette & Stroke Width */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Colors */}
            <div className="flex items-center gap-1 bg-slate-800/70 p-1 rounded-lg border border-slate-700/70">
              {COLOR_PALETTE.map((c) => {
                const isSelected = tool === 'pen' && selectedColor === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setSelectedColor(c.value);
                      setTool('pen');
                    }}
                    title={`Cor: ${c.name}`}
                    aria-label={`Cor ${c.name}`}
                    className={`w-5 h-5 md:w-6 md:h-6 rounded-full ${c.bgClass} transition-transform ${
                      isSelected
                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 scale-110'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                  />
                );
              })}
            </div>

            {/* Stroke Width Selector */}
            <div className="flex items-center gap-1 bg-slate-800/70 px-1.5 py-1 rounded-lg border border-slate-700/70">
              {STROKE_WIDTH_OPTIONS.map((opt) => (
                <button
                  key={opt.width}
                  type="button"
                  onClick={() => setStrokeWidth(opt.width)}
                  title={`Espessura ${opt.label} (${opt.width}px)`}
                  className={`px-1.5 py-1 rounded flex items-center justify-center transition-colors ${
                    strokeWidth === opt.width
                      ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className={`${opt.dotSize} rounded-full bg-current block`} />
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: Undo, Clear, Background Mode, Minimize, Close */}
          <div className="flex items-center gap-1 md:gap-1.5">
            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={strokesCount === 0 && !canRestoreClear}
              title="Desfazer (Ctrl+Z)"
              className="p-1.5 md:p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <RotateCcw className="w-4 h-4 md:w-4.5 md:h-4.5" />
            </button>

            {/* Clear Board */}
            <button
              type="button"
              onClick={handleClear}
              disabled={strokesCount === 0}
              title="Limpar lousa inteira"
              className="p-1.5 md:p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Trash2 className="w-4 h-4 md:w-4.5 md:h-4.5" />
            </button>

            {/* Background Style Switcher */}
            <button
              type="button"
              onClick={cycleBackgroundMode}
              title={`Estilo de Fundo: ${bgMode === 'translucent' ? 'Translúcido' : bgMode === 'chalkboard' ? 'Escuro' : 'Grade'}`}
              className="p-1.5 md:p-2 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-colors"
            >
              {bgMode === 'grid' ? (
                <Grid className="w-4 h-4 md:w-4.5 md:h-4.5 text-amber-400" />
              ) : (
                <Layers className="w-4 h-4 md:w-4.5 md:h-4.5" />
              )}
            </button>

            <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />

            {/* Minimize */}
            <button
              type="button"
              onClick={handleClose}
              title="Minimizar (mantém o rascunho salvo)"
              className="flex items-center gap-1 px-2 py-1.5 md:px-2.5 md:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-medium transition-colors border border-slate-700"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Minimizar</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              title="Fechar lousa"
              className="p-1.5 md:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </header>

        {/* Canvas Area */}
        <div ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none cursor-crosshair block"
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerUp}
          />

          {/* Subtitle / Tip Overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none text-[11px] md:text-xs text-slate-400/80 bg-slate-900/70 border border-slate-800/80 px-3 py-1 rounded-full backdrop-blur-sm transition-opacity">
            {strokesCount === 0
              ? 'Rabisque livremente com mouse, caneta stylus ou toque • Minimize para consultar o exercício'
              : `${strokesCount} ${strokesCount === 1 ? 'traço salvo' : 'traços salvos'} • Minimize a qualquer momento`}
          </div>
        </div>
      </div>
    </>
  );
};

export default Scratchpad;
