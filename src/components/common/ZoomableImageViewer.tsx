import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, X, Move, FileText } from 'lucide-react';

interface ZoomableImageViewerProps {
  src: string;
  alt?: string;
  title?: string;
  details?: string;
  fileName?: string;
  fileType?: 'image' | 'pdf' | string;
  onClose: () => void;
}

export const ZoomableImageViewer: React.FC<ZoomableImageViewerProps> = ({
  src,
  alt = 'Document Preview',
  title = 'Document Inspection',
  details,
  fileName,
  fileType = 'image',
  onClose,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);

  // Reset zoom & pan
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom In / Out handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.35, 4.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.35, 0.75);
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Mouse Drag Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse Wheel Zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.2 : -0.2;
    setScale((prev) => {
      const newScale = Math.min(Math.max(prev + zoomFactor, 0.75), 4.5);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Touch Handlers for Mobile (Pinch to Zoom & Touch Pan)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two fingers pinch start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialTouchDistanceRef.current = dist;
      initialScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      // Single finger drag start
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistanceRef.current !== null) {
      // Pinching
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / initialTouchDistanceRef.current;
      const newScale = Math.min(Math.max(initialScaleRef.current * ratio, 0.75), 4.5);
      setScale(newScale);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging) {
      // Single finger drag
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    initialTouchDistanceRef.current = null;
    setIsDragging(false);
  };

  // Double Click / Tap Toggle Zoom
  const handleDoubleClick = () => {
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2.2);
    }
  };

  const formattedScale = Math.round(scale * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/15 rounded-2xl max-w-2xl sm:max-w-3xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-white/10 shrink-0 bg-slate-50/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          <div className="min-w-0 pr-3">
            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
              {title}
            </h3>
            {details && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate mt-0.5">
                {details}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-200/80 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-colors cursor-pointer shrink-0"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Controls */}
        {fileType === 'image' && src && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-100 dark:bg-zinc-950 border-b border-slate-200 dark:border-white/10 text-xs shrink-0 select-none">
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="font-mono font-bold px-2 py-1 rounded bg-slate-200/70 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 min-w-[50px] text-center">
                {formattedScale}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer ml-1"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {(scale !== 1 || rotation !== 0 || position.x !== 0 || position.y !== 0) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-medium transition-colors cursor-pointer text-[11px]"
                  title="Reset Zoom & Pan"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Instruction Badge */}
            <div className="hidden sm:flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 text-[11px]">
              <Move className="w-3 h-3 text-sky-500" />
              <span>Scroll or pinch to zoom • Drag to move</span>
            </div>
          </div>
        )}

        {/* Main Viewing Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          className={`flex-1 relative bg-slate-900 overflow-hidden min-h-[300px] sm:min-h-[420px] max-h-[65vh] flex items-center justify-center select-none ${
            isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
          }`}
        >
          {fileType === 'image' && src ? (
            <div
              className="w-full h-full flex items-center justify-center p-2"
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
                transformOrigin: 'center center',
              }}
            >
              <img
                src={src}
                alt={alt}
                draggable={false}
                className="max-w-full max-h-[60vh] object-contain rounded shadow-lg pointer-events-none"
              />
            </div>
          ) : (
            <div className="text-center p-8 space-y-3">
              <FileText className="w-16 h-16 text-emerald-400 mx-auto animate-pulse" />
              <div className="text-sm font-mono font-bold text-white">
                {fileName || 'Official Document Attached'}
              </div>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                PDF document loaded for administrative inspection and verification.
              </p>
            </div>
          )}
        </div>

        {/* Footer Close Action */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-between gap-3">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
            {fileName || 'Clearance Proof Attachment'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:bg-zinc-800 dark:hover:bg-white transition-colors cursor-pointer shrink-0"
          >
            Close Inspection
          </button>
        </div>

      </div>
    </div>
  );
};
