import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioMessageProps {
  src: string;
  duration?: number;
  transcription?: string;
  // Compatibilidad con nueva estructura de datos
  audio?: {
    archivo_url?: string;
    duracion_segundos?: number;
    transcripcion?: string;
  };
}

export const AudioMessage: React.FC<AudioMessageProps> = ({ 
  src, 
  duration: initialDuration, 
  transcription,
  audio 
}) => {
  // Usar propiedades de audio si están disponibles, de lo contrario usar props directos
  const audioSrc = audio?.archivo_url || src;
  const audioDuration = audio?.duracion_segundos || initialDuration || 0;
  const audioTranscription = audio?.transcripcion || transcription;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(audioDuration);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!audioRef.current) {
      // Asegurarnos de que tenemos una URL válida
      const validAudioSrc = audioSrc || '';
      if (!validAudioSrc) {
        console.error("No se proporcionó URL de audio válida");
        return;
      }

      audioRef.current = new Audio(validAudioSrc);
      
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          // Aseguramos que la duración sea un número válido
          const loadedDuration = !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration) 
            ? audioRef.current.duration 
            : audioDuration;
          setDuration(loadedDuration);
        }
      });
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        updateProgressBar(0);
      });
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current.remove();
        audioRef.current = null;
      }
    };
  }, [audioSrc, audioDuration]);

  // Función para actualizar el tiempo actual durante la reproducción
  const updateTimeDisplay = () => {
    if (!audioRef.current) return;
    
    setCurrentTime(audioRef.current.currentTime);
    updateProgressBar();
    
    if (audioRef.current.ended) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsPlaying(false);
      return;
    }
    
    animationRef.current = requestAnimationFrame(updateTimeDisplay);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      // Si el audio llegó al final, reiniciar
      if (audioRef.current.currentTime === audioRef.current.duration) {
        audioRef.current.currentTime = 0;
      }
      audioRef.current.play()
        .then(() => {
          animationRef.current = requestAnimationFrame(updateTimeDisplay);
        })
        .catch(error => {
          console.error("Error playing audio:", error);
        });
    }
    
    setIsPlaying(!isPlaying);
  };

  const updateProgressBar = (time?: number) => {
    if (!progressRef.current || !audioRef.current) return;
    
    const progressPercent = time !== undefined 
      ? (time / duration) * 100
      : (audioRef.current.currentTime / duration) * 100;
      
    progressRef.current.style.width = `${progressPercent}%`;
  };

  const formatTime = (timeInSeconds: number): string => {
    if (!isFinite(timeInSeconds) || isNaN(timeInSeconds)) return "0:00";
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = offsetX / width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    updateProgressBar(newTime);
  };
  
  // Renderizar una forma de onda estática para imitar el estilo de WhatsApp
  const renderWaveform = () => {
    const bars = 30; // Número de barras en la forma de onda
    return Array.from({ length: bars }).map((_, index) => {
      // Crear alturas aleatorias pero con un patrón estético
      const height = 10 + Math.sin(index * 0.5) * 10 + Math.random() * 20;
      return (
        <div
          key={index}
          className="bg-white/30 rounded-full w-[2px] mx-[2px]"
          style={{ height: `${height}%` }}
        />
      );
    });
  };

  // Si no hay URL de audio válida, mostrar un mensaje de error
  if (!audioSrc) {
    return (
      <div className="text-sm text-red-500 italic">
        El mensaje de audio no está disponible
      </div>
    );
  }

  return (
    <div className="audio-message">
      <button 
        className="audio-play-button bg-primary/20 text-primary hover:bg-primary/30 transition-colors" 
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>
      
      <div className="audio-controls">
        <div 
          className="audio-waveform"
          onClick={handleProgressClick}
        >
          <div ref={waveformRef} className="absolute inset-0 flex items-center px-2 pointer-events-none">
            {renderWaveform()}
          </div>
          <div 
            ref={progressRef} 
            className="audio-waveform-progress"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        <span className="audio-duration">
          {formatTime(duration)}
        </span>
      </div>
      
      {audioTranscription && (
        <div className="audio-transcription mt-2 text-sm text-gray-600">
          <p>{audioTranscription}</p>
        </div>
      )}
    </div>
  );
};