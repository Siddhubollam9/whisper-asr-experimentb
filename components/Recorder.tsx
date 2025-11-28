import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';

interface RecorderProps {
  onAudioCaptured: (blob: Blob) => void;
}

export const Recorder: React.FC<RecorderProps> = ({ onAudioCaptured }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onAudioCaptured(blob);
        stream.getTracks().forEach(track => track.stop()); // Clean up
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAudioCaptured(file);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-800 rounded-xl border border-slate-700 items-center justify-center">
      <div className="text-slate-400 mb-2 font-medium">Capture Speech Sample</div>
      
      <div className="flex gap-4 items-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {isRecording ? <ICONS.Pause size={20} /> : <ICONS.Mic size={20} />}
          {isRecording ? `Stop (${formatTime(duration)})` : 'Record Microphone'}
        </button>

        <span className="text-slate-500 text-sm">OR</span>

        <label className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer transition-colors border border-slate-600">
          <ICONS.Upload size={18} />
          <span>Upload Audio</span>
          <input 
            type="file" 
            accept="audio/*" 
            className="hidden" 
            onChange={handleFileUpload}
          />
        </label>
      </div>
      <p className="text-xs text-slate-500 mt-2">Supports WAV, MP3, WEBM (Indian-English accents recommended)</p>
    </div>
  );
};
