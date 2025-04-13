import React from 'react';

interface RecordingAnimationProps {
  duration: number;
  onCancel: () => void;
  onSend: () => void;
}

export const RecordingAnimation: React.FC<RecordingAnimationProps> = ({ 
  duration, 
  onCancel,
  onSend
}) => {
  // Formatea la duración en minutos y segundos
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between space-x-3 px-2 py-1 relative w-full">
      <button 
        onClick={onCancel}
        className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
        aria-label="Cancelar grabación"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 5L5 19M5.00001 5L19 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="audio-recording-counter">{formatTime(duration)}</span>
      </div>
      
      <div className="recording-animation mx-2">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <button 
        onClick={onSend}
        className="p-2 rounded-full text-emerald-500 hover:bg-emerald-500/10 transition-colors"
        aria-label="Enviar grabación"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};