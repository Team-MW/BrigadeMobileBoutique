import React, { useState } from 'react'
import { Lock } from 'lucide-react'

export default function LockScreen({ onUnlock }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const handleKeyPress = (num) => {
    if (code.length >= 4) return
    setError(false)
    const newCode = code + num
    setCode(newCode)
    
    if (newCode === '1234') {
      setTimeout(() => {
        onUnlock()
      }, 300)
    } else if (newCode.length === 4) {
      // Wrong code animation
      setTimeout(() => {
        setError(true)
        setCode('')
      }, 250)
    }
  }

  const handleDelete = () => {
    setCode(prev => prev.slice(0, -1))
    setError(false)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white p-4 font-sans relative overflow-hidden select-none">
      {/* Abstract background glow dots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className={`max-w-md w-full flex flex-col items-center gap-8 z-10 ${error ? 'animate-shake' : ''}`}>
        {/* Shield/Lock Status Icon */}
        <div className={`p-5 rounded-full bg-slate-900 border transition-all duration-300 ${error ? 'border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.2)]' : 'border-slate-800 shadow-[0_0_20px_rgba(99,102,241,0.1)]'}`}>
          <Lock className={`w-8 h-8 ${error ? 'text-rose-500' : 'text-indigo-500 animate-pulse'}`} />
        </div>

        {/* Text Details */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black tracking-tight">Accès Administrateur</h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Veuillez saisir votre code d'accès</p>
        </div>

        {/* Interactive Passcode Indicator Dots */}
        <div className="flex gap-4 justify-center py-2">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                idx < code.length
                  ? (error ? 'bg-rose-500 border-rose-500 scale-110' : 'bg-indigo-500 border-indigo-500 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.6)]')
                  : 'border-slate-700 bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Numeric keypad layout */}
        <div className="grid grid-cols-3 gap-4 max-w-[270px] w-full mt-4 justify-items-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(String(num))}
              className="w-16 h-16 rounded-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-sm active:bg-indigo-950/50"
            >
              {num}
            </button>
          ))}
          
          <button
            type="button"
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-slate-900/20 hover:bg-slate-900/40 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center transition-all active:scale-95"
          >
            Retour
          </button>
          
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-xl font-bold flex items-center justify-center transition-all active:scale-95 active:bg-indigo-950/50 shadow-sm"
          >
            0
          </button>
          
          <div className="w-16 h-16" /> {/* Spacer */}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.15s ease-in-out 2;
        }
      `}} />
    </div>
  )
}
