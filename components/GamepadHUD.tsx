import React from 'react';
import { GamepadState, Theme } from '../types';
import { COLORS } from '../constants';

interface Props {
  gp: GamepadState;
  theme: Theme;
}

const GamepadHUD: React.FC<Props> = ({ gp, theme }) => {
  if (!gp.connected) return null;

  const color = '#' + COLORS[theme].primary.toString(16).padStart(6, '0');

  return (
    <div className="absolute bottom-8 right-8 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-2xl">
       <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase font-bold tracking-widest text-white/70">Controller Active</span>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
       </div>
       
       {/* Simple representation of inputs */}
       <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
          <div className="flex flex-col gap-1">
             <div className="flex justify-between"><span>L-Stick X:</span> <span style={{color}}>{gp.leftStick.x.toFixed(2)}</span></div>
             <div className="flex justify-between"><span>L-Stick Y:</span> <span style={{color}}>{gp.leftStick.y.toFixed(2)}</span></div>
             <div className="flex justify-between"><span>Trigger L:</span> <span style={{color}}>{gp.triggers.left.toFixed(2)}</span></div>
          </div>
          <div className="flex flex-col gap-1">
             <div className="flex justify-between"><span>R-Stick X:</span> <span style={{color}}>{gp.rightStick.x.toFixed(2)}</span></div>
             <div className="flex justify-between"><span>R-Stick Y:</span> <span style={{color}}>{gp.rightStick.y.toFixed(2)}</span></div>
             <div className="flex justify-between"><span>Scratch:</span> <span className={Math.abs(gp.rightStick.velocity) > 0.1 ? 'text-red-400 font-bold' : 'text-white/50'}>{Math.abs(gp.rightStick.velocity) > 0.1 ? 'ACTIVE' : 'IDLE'}</span></div>
          </div>
       </div>

       <div className="mt-3 flex gap-2 justify-center">
          {['A', 'B', 'X', 'Y'].map(btn => (
             <div key={btn} 
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors
                ${gp.buttons[btn.toLowerCase() as keyof typeof gp.buttons] 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-white/30 border-white/20'}`}
             >
                {btn}
             </div>
          ))}
       </div>
    </div>
  );
};

export default GamepadHUD;