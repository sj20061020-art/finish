import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { AudioService } from '../services/audioService';
import { GamepadService } from '../services/gamepadService';
import { VisualMode, Theme, VisualizerConfig, GamepadState, AudioFrequencyData } from '../types';
import { COLORS, MAX_PARTICLES } from '../constants';

interface Props {
  audioService: AudioService;
  gamepadService: GamepadService;
  config: VisualizerConfig;
  onUpdateConfig: (cfg: Partial<VisualizerConfig>) => void;
  onStatsUpdate: (audio: AudioFrequencyData, gp: GamepadState) => void;
}

const VisualizerCanvas: React.FC<Props> = ({ 
  audioService, 
  gamepadService, 
  config, 
  onUpdateConfig, 
  onStatsUpdate 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  const hueRef = useRef(0);
  
  useEffect(() => { configRef.current = config; }, [config]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0004);

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 60;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const orbGroup = new THREE.Group();
    const vortexGroup = new THREE.Group();
    const coreGroup = new THREE.Group();
    scene.add(orbGroup);
    scene.add(vortexGroup);
    scene.add(coreGroup);

    const getCircleTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const center = 16;
            const radius = 14; 
            const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
        return new THREE.CanvasTexture(canvas);
    };

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.2, 
      map: getCircleTexture(),
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      opacity: 0.9
    });

    const createPoints = (count: number, initFn: (i: number, pos: Float32Array, col: Float32Array, orig: Float32Array, extras: Float32Array) => void) => {
       const geo = new THREE.BufferGeometry();
       const pos = new Float32Array(count * 3);
       const col = new Float32Array(count * 3);
       const orig = new Float32Array(count * 3);
       const extras = new Float32Array(count * 3);
       
       for(let i=0; i<count; i++) {
          initFn(i, pos, col, orig, extras);
          col[i*3]=1; col[i*3+1]=1; col[i*3+2]=1;
       }
       geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
       geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
       return { mesh: new THREE.Points(geo, particleMaterial.clone()), geo, orig, extras };
    };

    const orbSystem = createPoints(MAX_PARTICLES, (i, pos, col, orig, extras) => {
       const phi = Math.PI * (3 - Math.sqrt(5)); 
       const y = 1 - (i / (MAX_PARTICLES - 1)) * 2; 
       const radius = Math.sqrt(1 - y * y); 
       const theta = phi * i; 
       const r = 14; 
       const x = Math.cos(theta) * radius * r;
       const yScaled = y * r;
       const z = Math.sin(theta) * radius * r;
       pos[i*3] = x; pos[i*3+1] = yScaled; pos[i*3+2] = z;
       orig[i*3] = x; orig[i*3+1] = yScaled; orig[i*3+2] = z;
       extras[i*3] = Math.random() * Math.PI * 2; 
       extras[i*3+1] = Math.random(); 
       extras[i*3+2] = (Math.random() - 0.5) * 2; 
    });
    orbGroup.add(orbSystem.mesh);

    const vortexSystem = createPoints(MAX_PARTICLES, (i, pos, col, orig, extras) => {
       const arms = 6;
       const maxRadius = 28;
       const r = Math.pow(Math.random(), 2) * maxRadius;
       const spin = r * 0.2;
       const armIndex = i % arms;
       const theta = (armIndex / arms) * Math.PI * 2 + spin + (Math.random() - 0.5) * 0.5;
       const px = Math.cos(theta) * r;
       const py = (Math.random() - 0.5) * (10 * Math.exp(-r * 0.05)); 
       const pz = Math.sin(theta) * r;
       pos[i*3] = px; pos[i*3+1] = py; pos[i*3+2] = pz;
       orig[i*3] = px; orig[i*3+1] = py; orig[i*3+2] = pz;
       extras[i*3] = Math.random();
       extras[i*3+1] = Math.random();
       extras[i*3+2] = Math.random();
    });
    vortexGroup.add(vortexSystem.mesh);

    const coreSystem = createPoints(MAX_PARTICLES, (i, pos, col, orig, extras) => {
        const r = Math.pow(Math.random(), 3) * 12; 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
        orig[i*3] = x; orig[i*3+1] = y; orig[i*3+2] = z;
        extras[i*3] = Math.random(); 
        extras[i*3+1] = Math.random(); 
        extras[i*3+2] = r; 
    });
    coreGroup.add(coreSystem.mesh);

    const pointLight = new THREE.PointLight(0xffffff, 2, 200);
    scene.add(pointLight);

    let frameId: number;
    let buttonLocks: {[key: string]: boolean} = {};
    const _color = new THREE.Color();
    let surfaceTime = 0;

    const updateParticleSubject = (
      group: THREE.Group, 
      system: { mesh: THREE.Points, orig: Float32Array, extras: Float32Array }, 
      audio: AudioFrequencyData, 
      realTime: number,
      surfaceTime: number, 
      config: { lowBoost: number, midBoost: number, explodeFactor: number, type: 'ORB' | 'VORTEX' | 'CORE' },
      colors: { p: THREE.Color, s: THREE.Color },
      fxState: { stutter: boolean, bandpass: boolean }
    ) => {
       const positions = system.mesh.geometry.attributes.position.array as Float32Array;
       const cols = system.mesh.geometry.attributes.color.array as Float32Array;
       const count = positions.length / 3;
       const { lowBoost, midBoost, type } = config;
       const bass = Math.pow(audio.low / 255, 3.0); 
       const mid = Math.pow(audio.mid / 255, 2.0);
       const high = Math.pow(audio.high / 255, 3.0); 
       const isGlitch = high > 0.6 && Math.random() < 0.3;
       const glitchQuantize = isGlitch ? 4.0 : 0;
       
       if (fxState.bandpass) {
         group.scale.setScalar(0.7 + Math.sin(realTime * 20) * 0.05);
       } else {
         group.scale.setScalar(1.0 + Math.sin(realTime) * 0.02);
       }

       if (type === 'ORB') {
          group.rotation.y = realTime * 0.1;
          group.rotation.z = Math.sin(realTime * 0.2) * 0.1;
       } else if (type === 'VORTEX') {
          group.rotation.y -= 0.003 + (mid * 0.05);
          if (isGlitch) group.rotation.z += 0.2;
       } else if (type === 'CORE') {
          group.rotation.x += 0.005 + (mid * 0.02);
          group.rotation.y += 0.01 + (bass * 0.03);
          group.rotation.z = Math.sin(realTime * 0.5) * 0.2;
       }

       const pulseExpansion = 1.0 + (bass * 0.8 * lowBoost); 
       const turbulenceMag = mid * midBoost * 6.0; 
       const morphSlow = Math.sin(realTime * 0.5); 
       const morphFast = Math.cos(realTime * 1.5);

       for(let i=0; i<count; i++) {
          const i3 = i*3;
          const ox = system.orig[i3];
          const oy = system.orig[i3+1];
          const oz = system.orig[i3+2];
          const phase = system.extras[i3];
          const randMag = system.extras[i3+1];
          const randSpeed = system.extras[i3+2]; 
          
          let nx = ox, ny = oy, nz = oz;
          let brightness = 0.5;
          let mix = 0.5;

          if (type === 'ORB') {
             const freq = 0.15; 
             const speed = 2.0 + randSpeed;
             const audioNoise = Math.sin(ox * freq + surfaceTime * speed + phase) 
                              + Math.cos(oy * freq + surfaceTime * (speed * 0.9)) 
                              + Math.sin(oz * freq + surfaceTime * (speed * 1.1));
             const liquidMorph = Math.sin(ox * 0.2 + realTime * 0.8) * Math.cos(oy * 0.2 + realTime * 0.6) * 2.0;
             const scale = pulseExpansion + (audioNoise * 0.08 * turbulenceMag) + (liquidMorph * 0.15 * mid);
             nx = ox * scale; ny = oy * scale; nz = oz * scale;
             brightness = 0.2 + (bass * 0.6) + (turbulenceMag * 0.15 * randMag);
             const currentRadius = Math.sqrt(nx*nx + ny*ny + nz*nz);
             const baseRadius = 14 * pulseExpansion; 
             mix = (currentRadius - baseRadius) / (10 * (turbulenceMag + 0.1));
             mix = Math.max(0, Math.min(1, mix + 0.2));
          } else if (type === 'VORTEX') {
             const dist = Math.sqrt(ox*ox + oz*oz);
             const angle = Math.atan2(oz, ox);
             const twistMorph = 1.0 + (morphSlow * 0.5); 
             const flow = realTime * (1 + bass);
             const flowOffset = Math.sin(dist * (0.2 * twistMorph) - flow) * 2;
             const wave = Math.sin(dist * 0.3 + angle * (2 + morphFast) + realTime * 2) * bass * 15 * randMag;
             const radiusMod = 1 + (Math.sin(realTime * 3 + dist * 0.1) * 0.05 * mid);
             nx = (ox + flowOffset * Math.cos(angle)) * radiusMod;
             ny = oy + wave;
             nz = (oz + flowOffset * Math.sin(angle)) * radiusMod;
             brightness = (1 - (dist / 35)) + (bass * 0.5);
             mix = (Math.sqrt(nx*nx + nz*nz) / 28) + bass; 
          } else if (type === 'CORE') {
             const coreExpansion = 1.0 + (bass * 3.0 * lowBoost); 
             const jitter = high * 2.0 * Math.random();
             nx = ox * coreExpansion; ny = oy * coreExpansion; nz = oz * coreExpansion;
             if (Math.random() < 0.2) {
                 nx += (Math.random() - 0.5) * jitter;
                 ny += (Math.random() - 0.5) * jitter;
                 nz += (Math.random() - 0.5) * jitter;
             }
             const dist = Math.sqrt(nx*nx + ny*ny + nz*nz);
             brightness = (10 / (dist + 1)) * (0.5 + bass);
             mix = Math.min(1, dist / 20);
          }

          if (glitchQuantize > 0) {
             nx = Math.round(nx / glitchQuantize) * glitchQuantize;
             ny = Math.round(ny / glitchQuantize) * glitchQuantize;
             nz = Math.round(nz / glitchQuantize) * glitchQuantize;
             brightness = 1.5; 
          }

          if (fxState.stutter) {
             if (i % 2 === 0) brightness = 0;
             else brightness *= 2; 
          }

          _color.lerpColors(colors.p, colors.s, mix);
          if (isGlitch && randMag > 0.8) {
             _color.setHex(0xffffff);
             brightness = 2.0;
          }
          brightness = Math.min(brightness, 2.5);
          cols[i3] = _color.r * brightness;
          cols[i3+1] = _color.g * brightness;
          cols[i3+2] = _color.b * brightness;
          positions[i3] = nx; positions[i3+1] = ny; positions[i3+2] = nz;
       }
       
       system.mesh.geometry.attributes.position.needsUpdate = true;
       system.mesh.geometry.attributes.color.needsUpdate = true;
    }

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const audioData = audioService.getFrequencyData();
      const gpState = gamepadService.getGamepadState();
      const cfg = configRef.current;
      onStatsUpdate(audioData, gpState);
      const now = Date.now() * 0.001;
      const bassNorm = audioData.low / 255;
      hueRef.current += 0.001 + (bassNorm * 0.005);
      const palette = COLORS[cfg.theme];
      const pColor = new THREE.Color(palette.primary);
      const sColor = new THREE.Color(palette.secondary);
      pColor.offsetHSL(hueRef.current, 0, 0);
      sColor.offsetHSL(hueRef.current + 0.1, 0, 0);
      const midNorm = audioData.mid / 255;
      surfaceTime += 0.016 * (0.5 + midNorm * 4.0); 

      let filterType: BiquadFilterType = 'allpass';
      let filterFreq = 22000;
      let filterQ = 1;
      if (gpState.buttons.a) { filterType = 'lowpass'; filterFreq = 300; } 
      else if (gpState.buttons.y) { filterType = 'highpass'; filterFreq = 2000; } 
      else if (gpState.buttons.x) { filterType = 'bandpass'; filterFreq = 1000; filterQ = 2; }
      audioService.setFilter(filterType, filterFreq, filterQ);

      const isStutter = gpState.buttons.b;
      audioService.setStutter(isStutter ? (Math.sin(now * 75) > 0) : false);

      if (gpState.buttons.dpadRight && !buttonLocks['dr']) {
        const themes = Object.values(Theme);
        const idx = themes.indexOf(cfg.theme);
        onUpdateConfig({ theme: themes[(idx + 1) % themes.length] });
        buttonLocks['dr'] = true;
      } else if (!gpState.buttons.dpadRight) buttonLocks['dr'] = false;

      const modes = [VisualMode.ORB, VisualMode.VORTEX, VisualMode.CORE];
      const currentModeIdx = modes.indexOf(cfg.mode);
      if (gpState.buttons.rb && !buttonLocks['rb']) {
          onUpdateConfig({ mode: modes[(currentModeIdx + 1) % modes.length] });
          buttonLocks['rb'] = true;
      } else if (!gpState.buttons.rb) buttonLocks['rb'] = false;
      if (gpState.buttons.lb && !buttonLocks['lb']) {
          onUpdateConfig({ mode: modes[(currentModeIdx - 1 + modes.length) % modes.length] });
          buttonLocks['lb'] = true;
      } else if (!gpState.buttons.lb) buttonLocks['lb'] = false;

      const activeMode = cfg.mode;
      orbGroup.visible = activeMode === VisualMode.ORB;
      vortexGroup.visible = activeMode === VisualMode.VORTEX;
      coreGroup.visible = activeMode === VisualMode.CORE;

      let activeGroup = orbGroup, activeSystem = orbSystem, type: 'ORB' | 'VORTEX' | 'CORE' = 'ORB';
      if (activeMode === VisualMode.VORTEX) { activeGroup = vortexGroup; activeSystem = vortexSystem; type = 'VORTEX'; } 
      else if (activeMode === VisualMode.CORE) { activeGroup = coreGroup; activeSystem = coreSystem; type = 'CORE'; }

      let intensityMult = 1.0;
      if (gpState.connected) {
         audioService.setVolume(Math.max(0, Math.min(1, (gpState.leftStick.y + 1) / 2)));
         intensityMult = Math.max(0, Math.min(2, 1.0 + gpState.leftStick.y));
      } else { audioService.setVolume(1.0); }
      
      if (Math.abs(gpState.rightStick.velocity) > 0.1) {
         activeGroup.rotation.y += gpState.rightStick.velocity * 0.05;
         audioService.setPlaybackRate(1.0 + gpState.rightStick.velocity * 0.2);
      } else { audioService.setPlaybackRate(1.0); }

      updateParticleSubject(activeGroup, activeSystem, audioData, now, surfaceTime,
        { lowBoost: cfg.intensity.low * intensityMult, midBoost: cfg.intensity.mid * intensityMult, explodeFactor: 0, type },
        { p: pColor, s: sColor }, { stutter: isStutter, bandpass: filterType === 'bandpass' });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      orbSystem.geo.dispose(); vortexSystem.geo.dispose(); coreSystem.geo.dispose();
      particleMaterial.dispose();
    };
  }, [audioService, gamepadService]);

  return <div ref={containerRef} className="absolute inset-0 z-0 bg-transparent" />;
};

export default VisualizerCanvas;