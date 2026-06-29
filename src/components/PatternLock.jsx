import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const DOTS = [
  { id: 1, x: 50, y: 50 },
  { id: 2, x: 150, y: 50 },
  { id: 3, x: 250, y: 50 },
  { id: 4, x: 50, y: 150 },
  { id: 5, x: 150, y: 150 },
  { id: 6, x: 250, y: 150 },
  { id: 7, x: 50, y: 250 },
  { id: 8, x: 150, y: 250 },
  { id: 9, x: 250, y: 250 },
];

export default function PatternLock({ value, onChange, mode = 'edit' }) {
  const [path, setPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pointerPos, setPointerPos] = useState(null);
  const [animatedPath, setAnimatedPath] = useState([]);
  const [restartKey, setRestartKey] = useState(0);
  const svgRef = useRef(null);

  // Load existing path in view mode or edit mode initial state
  useEffect(() => {
    if (value && value.startsWith('Schéma:')) {
      const pathStr = value.replace('Schéma:', '').trim();
      const ids = pathStr.split('-').map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 9);
      setPath(ids);
    } else if (!value) {
      setPath([]);
    }
  }, [value]);

  // Sequential draw animation loop in view mode
  useEffect(() => {
    if (mode === 'view' && path.length > 0) {
      let currentIdx = 0;
      setAnimatedPath([path[0]]);
      
      const interval = setInterval(() => {
        currentIdx++;
        if (currentIdx < path.length) {
          setAnimatedPath(path.slice(0, currentIdx + 1));
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setRestartKey(prev => prev + 1);
          }, 1500); // 1.5s pause before restarting loop
        }
      }, 500); // Draw next segment every 500ms
      
      return () => clearInterval(interval);
    }
  }, [path, mode, restartKey]);

  const handlePointerDown = (e) => {
    if (mode === 'view') return;
    
    // Prevent default scrolling on mobile touch
    if (e.pointerType === 'touch') {
      e.target.releasePointerCapture(e.pointerId);
    }
    
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 300;
    const svgY = ((e.clientY - rect.top) / rect.height) * 300;

    setIsDrawing(true);
    setPointerPos({ x: svgX, y: svgY });

    // Check if clicked close to a dot
    for (const dot of DOTS) {
      const dx = svgX - dot.x;
      const dy = svgY - dot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30) {
        setPath([dot.id]);
        break;
      }
    }
  };

  const handlePointerMove = (e) => {
    if (mode === 'view' || !isDrawing) return;

    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * 300;
    const svgY = ((e.clientY - rect.top) / rect.height) * 300;

    setPointerPos({ x: svgX, y: svgY });

    // Check distance to all dots
    const threshold = 25; // active radius
    for (const dot of DOTS) {
      const dx = svgX - dot.x;
      const dy = svgY - dot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < threshold) {
        if (!path.includes(dot.id)) {
          // If there is a previous point, we can optionally check if we passed over a middle point
          const lastId = path[path.length - 1];
          if (lastId) {
            const middleDot = getMiddleDot(lastId, dot.id);
            if (middleDot && !path.includes(middleDot)) {
              setPath(prev => [...prev, middleDot, dot.id]);
            } else {
              setPath(prev => [...prev, dot.id]);
            }
          } else {
            setPath(prev => [...prev, dot.id]);
          }
        }
        break;
      }
    }
  };

  const handlePointerUp = () => {
    if (mode === 'view') return;
    setIsDrawing(false);
    setPointerPos(null);
    
    // Auto confirm if path is drawn
    if (path.length >= 2) {
      onChange('Schéma: ' + path.join('-'));
    }
  };

  // Helper to find intermediate dots (e.g. between 1 and 3 is 2)
  const getMiddleDot = (p1, p2) => {
    const map = {
      '1-3': 2, '3-1': 2,
      '1-7': 4, '7-1': 4,
      '3-9': 6, '9-3': 6,
      '7-9': 8, '9-7': 8,
      '1-9': 5, '9-1': 5,
      '3-7': 5, '7-3': 5,
      '2-8': 5, '8-2': 5,
      '4-6': 5, '6-4': 5,
    };
    return map[`${p1}-${p2}`] || null;
  };

  const handleClear = () => {
    setPath([]);
    onChange('');
  };

  // Render path lines
  const lines = [];
  const activePathForRender = mode === 'view' ? animatedPath : path;
  for (let i = 0; i < activePathForRender.length - 1; i++) {
    const p1 = DOTS.find(d => d.id === activePathForRender[i]);
    const p2 = DOTS.find(d => d.id === activePathForRender[i + 1]);
    if (p1 && p2) {
      lines.push(
        <line
          key={`line-${i}`}
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke="#f97316"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.9"
          className="animate-in fade-in duration-200"
        />
      );
    }
  }

  // Draw active tracking line to pointer
  if (isDrawing && pointerPos && path.length > 0) {
    const lastDot = DOTS.find(d => d.id === path[path.length - 1]);
    if (lastDot) {
      lines.push(
        <line
          key="line-active"
          x1={lastDot.x}
          y1={lastDot.y}
          x2={pointerPos.x}
          y2={pointerPos.y}
          stroke="#f97316"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="4,4"
          opacity="0.6"
        />
      );
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full flex justify-center">
        <svg
          ref={svgRef}
          viewBox="0 0 300 300"
          className={cn(
            "w-full max-w-[260px] aspect-square touch-none select-none rounded-3xl border shadow-2xl",
            mode === 'edit' && "cursor-crosshair"
          )}
          style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Connecting Lines */}
          {lines}

          {/* Dots */}
          {DOTS.map(dot => {
            const activePathForRender = mode === 'view' ? animatedPath : path;
            const isActive = activePathForRender.includes(dot.id);
            const isLast = activePathForRender[activePathForRender.length - 1] === dot.id;
            const orderIndex = path.indexOf(dot.id);

            return (
              <g key={dot.id}>
                {/* Outer Ring */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={isActive ? 22 : 18}
                  fill={isActive ? (isLast ? "rgba(16, 185, 129, 0.2)" : "rgba(249, 115, 22, 0.2)") : "rgba(255, 255, 255, 0.05)"}
                  stroke={isActive ? (isLast ? "#10b981" : "#f97316") : "rgba(255, 255, 255, 0.25)"}
                  strokeWidth={2}
                  className={cn(
                    "transition-all duration-200",
                    isActive && "animate-pulse"
                  )}
                />
                
                {/* Inner Core */}
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={isActive ? 8 : 6}
                  fill={isActive ? (isLast ? "#10b981" : "#f97316") : "rgba(255, 255, 255, 0.85)"}
                  className="transition-all duration-200"
                />

                {/* Inner core white center for active state */}
                {isActive && (
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={3}
                    fill="#ffffff"
                  />
                )}

                {/* Order Badge in view mode to show drawing sequence */}
                {mode === 'view' && isActive && (
                  <g className="animate-in zoom-in-75 duration-300">
                    <circle
                      cx={dot.x + 16}
                      cy={dot.y - 16}
                      r={8.5}
                      className="fill-emerald-500 stroke-white stroke-[1.5] shadow-md"
                    />
                    <text
                      x={dot.x + 16}
                      y={dot.y - 13}
                      className="fill-white text-[9px] font-black"
                      textAnchor="middle"
                    >
                      {orderIndex + 1}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {mode === 'edit' && (
        <div className="w-full max-w-[260px] flex items-center justify-between text-xs font-semibold px-1">
          <span className="text-muted-foreground">
            {path.length > 0 ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" />
                Drawn ({path.length} pts)
              </span>
            ) : (
              "Dessinez le schéma"
            )}
          </span>
          {path.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-destructive hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Effacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
