import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Song } from '../constants/songs';

interface MusicPlayerProps {
  song: Song;
  onNext?: () => void;
  onPrev?: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ song, onNext, onPrev }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(song.url);
    } else {
      audioRef.current.src = song.url;
    }

    const audio = audioRef.current;

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (onNext) onNext();
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    if (isPlaying) {
      audio.play().catch(e => console.error("Playback failed", e));
    }

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [song]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.songInfo}>
        <Text style={styles.title}>{song.title}</Text>
        <Text style={styles.artist}>{song.artist}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(progress / duration) * 100}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(progress)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={onPrev} style={styles.controlButton}>
          <SkipBack size={24} color="#d4af37" />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
          {isLoading ? (
            <ActivityIndicator color="#0b1e3d" />
          ) : isPlaying ? (
            <Pause size={32} color="#0b1e3d" fill="#0b1e3d" />
          ) : (
            <Play size={32} color="#0b1e3d" fill="#0b1e3d" />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onNext} style={styles.controlButton}>
          <SkipForward size={24} color="#d4af37" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 42, 82, 0.8)',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Playfair Display',
    textAlign: 'center',
  },
  artist: {
    color: '#d4af37',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
    letterSpacing: 1,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#d4af37',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
