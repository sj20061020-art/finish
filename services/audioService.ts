import { FFT_SIZE } from '../constants';

export class AudioService {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  
  // FX Nodes
  private filterNode: BiquadFilterNode | null = null;
  private stutterGainNode: GainNode | null = null;

  private dataArray: Uint8Array;
  private timeArray: Uint8Array;
  
  // File playback specific
  private audioBuffer: AudioBuffer | null = null;
  private fileSourceNode: AudioBufferSourceNode | null = null;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private isPlaying: boolean = false;

  constructor() {
    this.dataArray = new Uint8Array(FFT_SIZE / 2);
    this.timeArray = new Uint8Array(FFT_SIZE);
  }

  async initialize() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 1. Filter Node (Low/High/Band pass)
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'allpass';
      this.filterNode.frequency.value = 22000;

      // 2. Stutter Gain Node (For rhythmic gating)
      this.stutterGainNode = this.ctx.createGain();
      this.stutterGainNode.gain.value = 1.0;

      // 3. Analyser
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.85; 
      
      // 4. Master Gain
      this.gainNode = this.ctx.createGain();
      
      // Chain: Filter -> Stutter -> Analyser -> MasterGain -> Destination
      // Note: Source connects to Filter in useMicrophone/loadFile
      this.filterNode.connect(this.stutterGainNode);
      this.stutterGainNode.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async useMicrophone() {
    await this.initialize();
    if (this.source) {
      this.source.disconnect();
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.source = this.ctx!.createMediaStreamSource(stream);
      // Microphone connects to Filter, but we disconnect MasterGain from destination to avoid feedback
      this.source.connect(this.filterNode!);
      this.gainNode!.disconnect(); 
      // Analyser still works because it is before MasterGain
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  }

  async loadFile(file: File) {
    await this.initialize();
    if (this.source) {
      this.source.disconnect();
      if (this.fileSourceNode) {
        try { this.fileSourceNode.stop(); } catch(e) {}
      }
    }

    // Reconnect master gain if it was disconnected by mic
    try {
        this.gainNode!.connect(this.ctx!.destination);
    } catch(e) {}

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
    this.playBuffer();
  }

  private playBuffer() {
    if (!this.ctx || !this.audioBuffer) return;
    
    this.fileSourceNode = this.ctx.createBufferSource();
    this.fileSourceNode.buffer = this.audioBuffer;
    this.fileSourceNode.loop = true;
    
    this.source = this.fileSourceNode;
    // Source -> Filter -> ...
    this.source.connect(this.filterNode!); 
    
    const offset = this.pausedAt % this.audioBuffer.duration;
    this.fileSourceNode.start(0, offset);
    this.startTime = this.ctx.currentTime - offset;
    this.isPlaying = true;
  }

  togglePlay() {
    if (!this.ctx) return;
    
    if (this.isPlaying) {
      if (this.fileSourceNode) {
        try { this.fileSourceNode.stop(); } catch(e) {}
        this.pausedAt = this.ctx.currentTime - this.startTime;
        this.isPlaying = false;
      }
    } else {
      this.playBuffer();
    }
  }

  setVolume(val: number) {
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(val, this.ctx!.currentTime, 0.05);
    }
  }

  setPlaybackRate(rate: number) {
    if (this.fileSourceNode) {
      this.fileSourceNode.playbackRate.setTargetAtTime(rate, this.ctx!.currentTime, 0.1);
    }
  }

  // --- FX CONTROLS ---

  setFilter(type: BiquadFilterType, freq: number, q: number = 1) {
      if (this.filterNode && this.ctx) {
          // Smoothly transition parameters
          const t = this.ctx.currentTime;
          
          // Only switch type if necessary to avoid clicks, but 'allpass' transition might need it
          if (this.filterNode.type !== type) {
              this.filterNode.type = type;
          }
          
          this.filterNode.frequency.setTargetAtTime(freq, t, 0.1);
          this.filterNode.Q.setTargetAtTime(q, t, 0.1);
      }
  }

  setStutter(active: boolean) {
      if (this.stutterGainNode && this.ctx) {
          // Hard cut for stutter effect
          const val = active ? 0.0 : 1.0;
          this.stutterGainNode.gain.setTargetAtTime(val, this.ctx.currentTime, 0.01);
      }
  }

  getFrequencyData() {
    if (!this.analyser) return { low: 0, mid: 0, high: 0, raw: this.dataArray, timeDomain: this.timeArray };

    this.analyser.getByteFrequencyData(this.dataArray);
    this.analyser.getByteTimeDomainData(this.timeArray);

    const hzPerBin = (this.ctx?.sampleRate || 44100) / FFT_SIZE;
    const lowIndex = Math.floor(250 / hzPerBin);
    const midIndex = Math.floor(2000 / hzPerBin);

    const avg = (arr: Uint8Array, start: number, end: number) => {
      let sum = 0;
      for (let i = start; i < end; i++) sum += arr[i];
      return sum / (end - start || 1);
    };

    return {
      low: avg(this.dataArray, 0, lowIndex),
      mid: avg(this.dataArray, lowIndex, midIndex),
      high: avg(this.dataArray, midIndex, this.dataArray.length),
      raw: this.dataArray,
      timeDomain: this.timeArray
    };
  }
}