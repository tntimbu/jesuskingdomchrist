// Audio Sound Effect Helper using Web Audio API for Chimes & Alerts

export const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    
    // Function to play a clean harmonic tone
    const playNote = (freq: number, startTime: number, duration: number, vol = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Upbeat 3-note chime sequence: E5 (659Hz) -> A5 (880Hz) -> C#6 (1108Hz)
    playNote(659.25, 0.0, 0.25, 0.3);
    playNote(880.00, 0.12, 0.3, 0.35);
    playNote(1108.73, 0.26, 0.5, 0.4);
  } catch (err) {
    console.warn('Audio chime playback blocked or unavailable:', err);
  }
};

export const playWarningChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    const playNote = (freq: number, startTime: number, duration: number, type: OscillatorType = 'triangle') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Urgent 2-tone alarm chime (A5 -> F#5 -> A5)
    playNote(880.00, 0.0, 0.18, 'sine');
    playNote(739.99, 0.15, 0.18, 'sine');
    playNote(880.00, 0.3, 0.35, 'sine');
  } catch (err) {
    console.warn('Warning chime playback blocked or unavailable:', err);
  }
};
