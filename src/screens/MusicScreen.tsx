import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Music, Play, Heart, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { WORSHIP_SONGS, Song } from '../constants/songs';
import { MusicPlayer } from '../components/MusicPlayer';

const MOODS = ['SAD', 'ANXIOUS', 'LONELY', 'GRATEFUL', 'ANGRY', 'HOPEFUL'];

export default function MusicScreen() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>(WORSHIP_SONGS);

  useEffect(() => {
    if (selectedMood) {
      setFilteredSongs(WORSHIP_SONGS.filter(s => s.moods.includes(selectedMood)));
    } else {
      setFilteredSongs(WORSHIP_SONGS);
    }
  }, [selectedMood]);

  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
  };

  const handleNext = () => {
    if (!currentSong) return;
    const currentIndex = filteredSongs.findIndex(s => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % filteredSongs.length;
    setCurrentSong(filteredSongs[nextIndex]);
  };

  const handlePrev = () => {
    if (!currentSong) return;
    const currentIndex = filteredSongs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + filteredSongs.length) % filteredSongs.length;
    setCurrentSong(filteredSongs[prevIndex]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Music color="#d4af37" size={32} />
          <Text style={styles.title}>Worship Music</Text>
          <Text style={styles.subtitle}>Find peace in His presence</Text>
        </View>

        <View style={styles.moodSection}>
          <Text style={styles.sectionLabel}>BROWSE BY MOOD</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
            <TouchableOpacity 
              style={[styles.moodChip, !selectedMood && styles.moodChipActive]}
              onPress={() => setSelectedMood(null)}
            >
              <Text style={[styles.moodChipText, !selectedMood && styles.moodChipTextActive]}>ALL</Text>
            </TouchableOpacity>
            {MOODS.map(mood => (
              <TouchableOpacity 
                key={mood}
                style={[styles.moodChip, selectedMood === mood && styles.moodChipActive]}
                onPress={() => setSelectedMood(mood)}
              >
                <Text style={[styles.moodChipText, selectedMood === mood && styles.moodChipTextActive]}>{mood}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.songList}>
          <Text style={styles.sectionLabel}>
            {selectedMood ? `${selectedMood} WORSHIP` : 'RECOMMENDED FOR YOU'}
          </Text>
          {filteredSongs.map((song, index) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <TouchableOpacity 
                style={[styles.songItem, currentSong?.id === song.id && styles.songItemActive]}
                onPress={() => handlePlaySong(song)}
              >
                <Image source={{ uri: song.coverUrl }} style={styles.songCover} />
                <View style={styles.songDetails}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.songArtist}>{song.artist}</Text>
                </View>
                <TouchableOpacity style={styles.playIconButton}>
                  <Play size={16} color={currentSong?.id === song.id ? '#0b1e3d' : '#d4af37'} fill={currentSong?.id === song.id ? '#0b1e3d' : 'transparent'} />
                </TouchableOpacity>
              </TouchableOpacity>
            </motion.div>
          ))}
        </View>
      </ScrollView>

      {currentSong && (
        <View style={styles.playerWrapper}>
          <MusicPlayer 
            song={currentSong} 
            onNext={handleNext}
            onPrev={handlePrev}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 150, // Space for player
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    color: '#d4af37',
    fontFamily: 'Playfair Display',
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    color: '#f5d77a',
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  moodSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 15,
    opacity: 0.6,
  },
  moodScroll: {
    flexDirection: 'row',
  },
  moodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    marginRight: 10,
  },
  moodChipActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  moodChipText: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  moodChipTextActive: {
    color: '#0b1e3d',
  },
  songList: {
    paddingHorizontal: 20,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 42, 82, 0.4)',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  songItemActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  songCover: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  songDetails: {
    flex: 1,
    marginLeft: 15,
  },
  songTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Playfair Display',
  },
  songArtist: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  playIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 100,
  }
});
