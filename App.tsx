import React, { useState, useEffect, useRef } from 'react';
import { AudioService } from './services/audioService';
import { GamepadService } from './services/gamepadService';
import VisualizerCanvas from './components/VisualizerCanvas';
import FrequencyMonitor from './components/FrequencyMonitor';
import GamepadHUD from './components/GamepadHUD';
import { VisualMode, Theme, VisualizerConfig, AudioFrequencyData, GamepadState } from './types';

// Icons
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const FullscreenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>;
const ExitFullscreenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6m0 0v6m0-6l-7 7m17-7h-6m0 0v6m0-6l7 7M4 10h6m0 0V4m0 6l-7-7m17 7h-6m0 0V4m0 6l7-7"></path></svg>;

const App: React.FC = () => {
  const [audioService] = useState(() => new AudioService());
  const [gamepadService] = useState(() => new GamepadService());
  const [started, setStarted] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // High-frequency stats state for React UI
  const [audioStats, setAudioStats] = useState<AudioFrequencyData>({ low: 0, mid: 0, high: 0, raw: new Uint8Array(), timeDomain: new Uint8Array() });
  const [gamepadStats, setGamepadStats] = useState<GamepadState | null>(null);

  const [config, setConfig] = useState<VisualizerConfig>({
    mode: VisualMode.ORB,
    theme: Theme.CYBERPUNK,
    intensity: { low: 1, mid: 1, high: 1 },
    particleSpeed: 1,
    globalScale: 1,
    activeEffect: 'none'
  });

  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  const handleStart = async (type: 'mic' | 'file', file?: File) => {
    try {
      if (type === 'mic') {
        await audioService.useMicrophone();
      } else if (file) {
        await audioService.loadFile(file);
      }
      setStarted(true);
    } catch (e) {
      console.error("Failed to start audio", e);
      alert("Could not initialize audio engine. Please check permissions.");
    }
  };

  useEffect(() => {
    if (started) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Failed to access camera", err);
        }
      };
      startCamera();
    }
  }, [started]);

  const lastUpdate = useRef(0);
  const handleStatsUpdate = (audio: AudioFrequencyData, gp: GamepadState) => {
    const now = Date.now();
    if (now - lastUpdate.current > 33) {
      setAudioStats({ ...audio });
      setGamepadStats(gp);
      lastUpdate.current = now;
    }
  };

  const updateConfig = (cfg: Partial<VisualizerConfig>) => {
    setConfig(prev => ({ ...prev, ...cfg }));
  };

  if (!started) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-950 text-white font-sans overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover"></div>
        <div className="z-10 max-w-lg w-full bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl transform transition-all hover:scale-[1.01]">
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            SONIC PULSE
          </h1>
          <p className="text-white/60 mb-8 font-light">
            Advanced WebGL Music Visualization System. Connect a gamepad for the full interactive experience.
          </p>
          <div className="space-y-4">
            <button onClick={() => handleStart('mic')} className="w-full group relative flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
              <MicIcon />
              <span className="font-bold tracking-wide">USE MICROPHONE</span>
            </button>
            <div className="relative w-full group">
              <input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && handleStart('file', e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="flex items-center justify-center gap-3 p-4 bg-white/5 group-hover:bg-white/10 border border-white/10 rounded-xl transition-all">
                <UploadIcon />
                <span className="font-bold tracking-wide">UPLOAD AUDIO FILE</span>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-xs text-white/40 font-mono space-y-1">
             <p className="font-bold text-white/60 mb-2">Controls:</p>
             <div className="grid grid-cols-2 gap-x-4 gap-y-1">
               <p>• <span className="text-cyan-400">Left Stick Y</span>: Volume & Size</p>
               <p>• <span className="text-cyan-400">Right Stick</span>: Scratch / DJ FX</p>
               <p>• <span className="text-cyan-400">A</span>: Low Pass (Bass Only)</p>
               <p>• <span className="text-cyan-400">Y</span>: High Pass (Treble Only)</p>
               <p>• <span className="text-cyan-400">X</span>: Band Pass (Mids Only)</p>
               <p>• <span className="text-cyan-400">B</span>: Stutter FX (Gater)</p>
               <p>• <span className="text-cyan-400">D-Pad Right</span>: Next Theme</p>
               <p>• <span className="text-cyan-400">LB/RB</span>: Switch Mode</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-black overflow-hidden font-sans">
      
      {/* Top Half: Camera Feed */}
      <div className={`transition-all duration-500 ease-in-out relative bg-gray-900 border-white/20 overflow-hidden ${isFullScreen ? 'h-0 opacity-0 border-b-0' : 'flex-1 border-b opacity-100'}`}>
         <video 
           ref={videoRef} 
           autoPlay 
           muted 
           playsInline 
           className="w-full h-full object-cover transform scale-x-[-1]" 
         />
         <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-mono text-white/70 tracking-widest border border-white/10">
            LIVE FEED
         </div>
      </div>

      {/* Bottom Half: Visualizer & UI */}
      <div className={`transition-all duration-500 ease-in-out relative bg-black ${isFullScreen ? 'h-full flex-none' : 'flex-1'}`}>
          <VisualizerCanvas 
            audioService={audioService}
            gamepadService={gamepadService}
            config={config}
            onUpdateConfig={updateConfig}
            onStatsUpdate={handleStatsUpdate}
          />

          {showUI && (
            <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-10">
              
              {/* Top Bar of Section */}
              <div className="flex justify-between items-start pointer-events-auto">
                 <div className="bg-black/50 backdrop-blur border border-white/10 px-4 py-2 rounded-lg">
                    <h1 className="text-white font-bold tracking-wider text-sm flex items-center gap-2">
                       SONIC PULSE 
                       <span className="text-[10px] font-normal px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">v1.7</span>
                    </h1>
                    <div className="flex gap-2 mt-1 text-[10px] text-white/50 cursor-pointer select-none flex-wrap max-w-2xl">
                      {[
                        { l: 'ORB', v: VisualMode.ORB },
                        { l: 'VORTEX', v: VisualMode.VORTEX },
                        { l: 'CORE', v: VisualMode.CORE },
                      ].map((m, i, arr) => (
                        <React.Fragment key={m.v}>
                          <span 
                            onClick={() => updateConfig({ mode: m.v })}
                            className={`hover:text-cyan-200 transition-colors ${config.mode === m.v ? "text-cyan-400 font-bold" : "text-white/50"}`}
                          >
                            {m.l}
                          </span>
                          {i < arr.length - 1 && <span className="text-white/20">/</span>}
                        </React.Fragment>
                      ))}
                    </div>
                 </div>
                 
                 <div className="flex gap-3">
                    <button 
                      onClick={() => setIsFullScreen(!isFullScreen)} 
                      className="bg-white/10 p-2 rounded-full hover:bg-white/20 text-white transition shadow-lg backdrop-blur"
                      title={isFullScreen ? "Split Screen" : "Fullscreen Visualizer"}
                    >
                      {isFullScreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
                    </button>
                    <button onClick={() => setShowUI(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 text-white transition shadow-lg backdrop-blur">
                        <SettingsIcon />
                    </button>
                 </div>
              </div>

              {/* Bottom Area of Section */}
              <div className="flex items-end justify-between w-full pointer-events-auto">
                <div className="w-80">
                   <FrequencyMonitor data={audioStats} theme={config.theme} />
                   <div className="mt-2 text-[10px] text-white/30 font-mono flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-cyan-500/50"></span>
                     THEME: {config.theme}
                   </div>
                </div>

                {gamepadStats?.connected ? (
                  <GamepadHUD gp={gamepadStats} theme={config.theme} />
                ) : (
                   <div className="text-white/30 text-xs font-mono animate-pulse bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur">
                     WAITING FOR GAMEPAD INPUT...
                   </div>
                )}
              </div>
            </div>
          )}

          {!showUI && (
             <div className="absolute top-4 right-4 z-50 flex gap-3 pointer-events-auto">
                <button 
                  onClick={() => setIsFullScreen(!isFullScreen)} 
                  className="bg-white/10 p-2 rounded-full hover:bg-white/20 text-white transition backdrop-blur border border-white/10"
                >
                  {isFullScreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
                </button>
                <button 
                  onClick={() => setShowUI(true)} 
                  className="bg-white/10 p-2 rounded-full hover:bg-white/20 text-white transition backdrop-blur border border-white/10"
                >
                  <SettingsIcon />
                </button>
             </div>
          )}
      </div>
    </div>
  );
};

export default App;