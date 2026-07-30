import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, Sparkles, AudioWaveform, RotateCcw } from 'lucide-react';
import { playNotificationChime } from '../utils/soundHelper';

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
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);

  const sentencesRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const speedRef = useRef<number>(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Load voices and listen to voiceschanged event
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setHasSpeechSupport(false);
      return;
    }

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available && available.length > 0) {
        setVoices(available);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isPlayingRef.current = false;
    };
  }, []);

  const getCleanText = () => {
    let content = '';
    if (title) content += `Renungan Harian: ${title}. `;
    if (verse) content += `Nats Alkitab: ${verse}. `;
    content += text;
    if (writer) content += `. Renungan ini ditulis oleh ${writer}.`;
    return content;
  };

  // Break text into readable sentence chunks safely without lookbehind regex
  const prepareSentences = () => {
    const rawText = getCleanText();
    const chunks = rawText
      .replace(/([.!?])\s+/g, '$1|#|')
      .split('|#|')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return chunks.length > 0 ? chunks : [rawText];
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudioFallback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const speakSentenceAtIndex = (index: number, chunks: string[]) => {
    if (index >= chunks.length || !isPlayingRef.current) {
      setIsPlaying(false);
      setIsPaused(false);
      isPlayingRef.current = false;
      return;
    }

    const sentenceText = chunks[index];

    if (!('speechSynthesis' in window)) {
      playAudioFallback(sentenceText, index, chunks);
      return;
    }

    try {
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(sentenceText);
      utterance.lang = 'id-ID';
      utterance.rate = speedRef.current;
      utterance.pitch = 1.0;

      // Find best Indonesian voice or fallback
      const availableVoices = voices.length > 0 ? voices : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
      const indonesianVoice = availableVoices.find(
        (v) => v.lang.includes('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia') || v.lang.includes('ms')
      );
      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
      }

      utterance.onend = () => {
        if (isPlayingRef.current) {
          const nextIndex = index + 1;
          setCurrentSentenceIndex(nextIndex);
          if (nextIndex < chunks.length) {
            speakSentenceAtIndex(nextIndex, chunks);
          } else {
            setIsPlaying(false);
            setIsPaused(false);
            isPlayingRef.current = false;
            setCurrentSentenceIndex(0);
          }
        }
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error event, trying fallback:', e);
        // Fallback to HTML Audio if SpeechSynthesis throws error
        playAudioFallback(sentenceText, index, chunks);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis exception, playing fallback:', err);
      playAudioFallback(sentenceText, index, chunks);
    }
  };

  const playAudioFallback = (sentenceText: string, index: number, chunks: string[]) => {
    stopAudioFallback();
    const encodedText = encodeURIComponent(sentenceText.slice(0, 200));
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=id&q=${encodedText}`;
    
    const audio = new Audio(ttsUrl);
    audio.playbackRate = speedRef.current;
    audioRef.current = audio;

    audio.onended = () => {
      if (isPlayingRef.current) {
        const nextIndex = index + 1;
        setCurrentSentenceIndex(nextIndex);
        if (nextIndex < chunks.length) {
          speakSentenceAtIndex(nextIndex, chunks);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
          isPlayingRef.current = false;
          setCurrentSentenceIndex(0);
        }
      }
    };

    audio.onerror = () => {
      // If fallback fails too, try next sentence or stop
      if (isPlayingRef.current && index + 1 < chunks.length) {
        speakSentenceAtIndex(index + 1, chunks);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        isPlayingRef.current = false;
      }
    };

    audio.play().catch(() => {
      // If audio.play() blocked, try next chunk or stop
      if (isPlayingRef.current && index + 1 < chunks.length) {
        speakSentenceAtIndex(index + 1, chunks);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        isPlayingRef.current = false;
      }
    });
  };

  const handlePlay = () => {
    stopAudioFallback();

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
      } catch (e) {
        // ignore
      }
    }

    // Play gentle audio chime confirmation
    try {
      playNotificationChime();
    } catch (e) {
      // ignore
    }

    if (isPaused) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      if (audioRef.current) {
        audioRef.current.play();
      }
      setIsPaused(false);
      setIsPlaying(true);
      isPlayingRef.current = true;
      return;
    }

    const chunks = prepareSentences();
    sentencesRef.current = chunks;
    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentSentenceIndex(0);

    // Call synchronously to preserve user gesture activation
    speakSentenceAtIndex(0, chunks);
  };

  const handlePause = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPaused(true);
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  const handleStop = () => {
    stopAudioFallback();
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(0);
  };

  const toggleSpeed = () => {
    const speeds = [0.85, 0.95, 1.15];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setSpeed(newSpeed);

    if (isPlaying) {
      handleStop();
      setTimeout(handlePlay, 200);
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-md transition-all cursor-pointer"
            title="Putar Suara Pembaca AI"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Suara AI</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePause}
              className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 text-[10px] font-bold transition-all cursor-pointer"
              title="Jeda"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleStop}
              className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 text-[10px] font-bold transition-all cursor-pointer"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
            <span className="flex items-center gap-1 text-[10px] text-indigo-300 font-semibold px-1 animate-pulse">
              <AudioWaveform className="w-3.5 h-3.5 text-amber-400" />
              <span>Membaca...</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950 border border-indigo-500/40 shadow-lg text-white space-y-3 my-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner">
            <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
              <span>Pemutar Suara AI Renungan Harian</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-extrabold uppercase border border-amber-500/30">
                TTS AI Active
              </span>
            </h4>
            <p className="text-[10px] sm:text-xs text-slate-300">
              Dengarkan renungan dibacakan otomatis oleh suara AI Bahasa Indonesia
            </p>
          </div>
        </div>

        <button
          onClick={toggleSpeed}
          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-extrabold text-indigo-200 border border-white/20 transition-all cursor-pointer shrink-0"
          title="Ubah Kecepatan Bicara"
        >
          {speed}x
        </button>
      </div>

      {/* Control Buttons & Soundwave Visualizer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 flex-wrap">
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span>{isPaused ? 'Lanjutkan Suara AI' : 'Putar Suara AI Renungan'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePause}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Jeda (Pause)</span>
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          )}
        </div>

        {/* Animated Sound Wave Effect */}
        {isPlaying && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
            <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
            <span className="text-[10px] font-extrabold text-amber-300 ml-1">AI Sedang Membaca...</span>
          </div>
        )}
      </div>
    </div>
  );
};
