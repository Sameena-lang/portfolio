import React, { useRef, useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';

interface HeroCharacter3DProps {
  reducedMotion: boolean;
  onUpdateBackdropPhoto?: (url: string) => void;
}

export const HeroCharacter3D: React.FC<HeroCharacter3DProps> = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] lg:h-[580px] rounded-2xl border border-[#A855F7]/40 bg-gradient-to-b from-[#170934]/80 via-[#0D0420]/80 to-[#070312]/90 backdrop-blur-xl overflow-hidden shadow-2xl shadow-[#9333EA]/25 flex items-center justify-center p-3 sm:p-4">
      {/* Ambient background blur glow matching Sameena's video lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-35 blur-3xl overflow-hidden"
      >
        <video
          src="/sameena-video.mp4"
          className="w-full h-full object-cover scale-125"
          muted
          loop
          autoPlay
          playsInline
        />
      </div>

      {/* Clean, high-definition video frame */}
      <div
        onClick={togglePlay}
        className="relative z-10 h-full max-h-[440px] sm:max-h-[500px] lg:max-h-[540px] aspect-[9/16] rounded-2xl overflow-hidden border border-[#A855F7]/50 shadow-[0_0_35px_rgba(168,85,247,0.3)] bg-[#070312] cursor-pointer group"
      >
        <video
          ref={videoRef}
          src="/sameena-video.mp4"
          className="w-full h-full object-cover"
          loop
          autoPlay
          playsInline
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Minimal play icon when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] transition-all">
            <div className="w-14 h-14 rounded-full bg-[#A855F7]/90 text-white flex items-center justify-center shadow-lg shadow-[#A855F7]/50">
              <Play className="w-6 h-6 ml-1 text-white" />
            </div>
          </div>
        )}

        {/* Discreet sound toggle in corner */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
          title={isMuted ? 'Click to unmute sound' : 'Click to mute sound'}
          className="absolute bottom-3 right-3 p-2.5 rounded-full bg-[#070312]/80 hover:bg-[#A855F7] text-[#FAF8FF] backdrop-blur-md border border-[#A855F7]/40 hover:border-[#C084FC] transition-all duration-200 shadow-lg cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-[#C4B5FD]" /> : <Volume2 className="w-4 h-4 text-[#FAF8FF]" />}
        </button>
      </div>
    </div>
  );
};
