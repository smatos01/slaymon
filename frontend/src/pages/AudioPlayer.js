import React, { useState, useRef, useEffect } from 'react';
import './AudioPlayer.css';

const TRACKS = [
  { name: 'Hidden Glade', file: 'Hidden-Glade.mp3' },
  { name: 'Haunted Corridor', file: 'Haunted-Corridor.mp3' },
  { name: 'Pocket Kingdom', file: 'Pocket-Kingdom.mp3' }
];

function AudioPlayer() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Keep playing through track switches — only pausing should ever stop it.
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [trackIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (direction) => {
    setTrackIndex(prev => (prev + direction + TRACKS.length) % TRACKS.length);
  };

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={`/audio/${encodeURIComponent(TRACKS[trackIndex].file)}`}
        loop
      />
      <button className="audio-btn" onClick={() => skip(-1)} aria-label="Previous track">⏮</button>
      <button className="audio-btn play-pause" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? '⏸' : '▶️'}
      </button>
      <button className="audio-btn" onClick={() => skip(1)} aria-label="Next track">⏭</button>
      <span className="audio-track-name">🎵 {TRACKS[trackIndex].name}</span>
    </div>
  );
}

export default AudioPlayer;
