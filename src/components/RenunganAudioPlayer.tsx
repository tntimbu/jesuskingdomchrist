import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, Sparkles, AudioWaveform } from 'lucide-react';

interface RenunganAudioPlayerProps {
  text: string;
  title?: string;
  verse?: string;
  writer?: string;
  compact?: boolean;
}

export const RenunganAudioPlayer: React.FC<RenunganAudioPlayerProps> = ({
  text,
  title,
  verse,
  writer,
  compact = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(0.95);
  const [hasSpeechSupport, setHasSpeechSupport] = useState<boolean>(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setHasSpeechSupport(false);
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getCleanText = () => {
    let content = '';
    if (title) content += `Renungan Harian. ${title}. `;
    if (verse) content += `Bacaan Alkitab. ${verse}. `;
    content += text;
    if (writer) content += `. Renungan ini ditulis oleh ${writer}.`;
    return content;
  };

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) {
      alert('Maaf, peramban Anda tidak mendukung pembaca suara AI.');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(getCleanText());
    utterance.lang = 'id-ID'; // Indonesian Language
    utterance.rate = speed;
    utterance.pitch = 1.0;

    // Try to assign Indonesian voice if available
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(
      (v) => v.lang.includes('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
    );
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const toggleSpeed = () => {
    const speeds = [0.85, 0.95, 1.15];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setSpeed(newSpeed);

    if (isPlaying) {
      handleStop();
      setTimeout(handlePlay, 100);
    }
  };

  if (!hasSpeechSupport) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 bg-indigo-950/80 p-1.5 rounded-xl border border-indigo-500/30">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-md transition-all cursor-pointer"
            title="Dengarkan Renungan dengan AI Speech"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Audio AI</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePause}
              className="p-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 text-[10px] font-bold transition-all cursor-pointer"
              title="Pause Audio"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleStop}
              className="p-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 text-[10px] font-bold transition-all cursor-pointer"
              title="Stop Audio"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
            <span className="flex items-center gap-1 text-[10px] text-indigo-300 font-semibold px-1.5 animate-pulse">
              <AudioWaveform className="w-3.5 h-3.5 text-amber-400" />
              <span>Membaca...</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950 border border-indigo-500/40 shadow-lg text-white space-y-2.5 my-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Volume2 className="w-4 h-4 text-indigo-300 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Pemutar Suara AI Renungan</span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/30 text-indigo-200 text-[9px] font-extrabold uppercase border border-indigo-400/30">
                TTS AI
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">Dengarkan renungan dibacakan otomatis oleh suara AI</p>
          </div>
        </div>

        <button
          onClick={toggleSpeed}
          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-indigo-300 border border-white/10 transition-all cursor-pointer"
          title="Ubah Kecepatan Suara"
        >
          Speed: {speed}x
        </button>
      </div>

      {/* Control Buttons & Soundwave Visualizer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPaused ? 'Lanjutkan Suara' : 'Putar Audio Renungan'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Jeda (Pause)</span>
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>

        {/* Animated Sound Wave Effect */}
        {isPlaying && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30">
            <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
            <span className="text-[10px] font-bold text-amber-300 ml-1">AI Pembaca Aktif</span>
          </div>
        )}
      </div>
    </div>
  );
};
