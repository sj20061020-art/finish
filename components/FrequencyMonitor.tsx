import React from 'react';
import { AudioFrequencyData, Theme } from '../types';
import { COLORS } from '../constants';

interface Props {
  data: AudioFrequencyData;
  theme: Theme;
}

const FrequencyMonitor: React.FC<Props> = ({ data, theme }) => {
  const colors = COLORS[theme];
  
  const getHex = (val: number) => '#' + val.toString(16).padStart(6, '0');

  const bands = [
    { label: 'LOW (0-250Hz)', val: data.low, color: colors.primary },
    { label: 'MID (250-2k)', val: data.mid, color: colors.secondary },
    { label: 'HIGH (2k+)', val: data.high, color: colors.tertiary },
  ];

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10">
      <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest mb-2">Signal Analysis</h3>
      {bands.map((band, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] text-white/50 w-20 font-mono">{band.label}</span>
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-75 ease-out"
              style={{ 
                width: `${(band.val / 255) * 100}%`,
                backgroundColor: getHex(band.color),
                boxShadow: `0 0 10px ${getHex(band.color)}`
              }}
            />
          </div>
          <span className="text-[10px] text-white w-6 text-right">{Math.round((band.val / 255) * 100)}%</span>
        </div>
      ))}
    </div>
  );
};

export default FrequencyMonitor;