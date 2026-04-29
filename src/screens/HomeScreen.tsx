import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator } from 'react-native';
import { motion } from 'motion/react';
import { supabase } from '../services/supabase';

const MotionView = motion(View);
import { Profile, Scripture } from '../types';
import { Search, Globe, Sparkles, Frown, Wind, User, Heart, Flame, Sun, HelpCircle, Layers, Zap, Video, Mic, Bookmark, Check } from 'lucide-react';
import { OWNER_EMAIL } from '../utils/tier';
import { getVerseReflection } from '../services/gemini';
import { getVerseOfTheDay } from '../services/verseOfTheDay';
import { VideoGenerator } from '../components/VideoGenerator';
import { saveScripture } from '../services/supabase';

const MOOD_CONFIG = [
  { key: 'ANXIOUS', label: 'Anxious', icon: Wind },
  { key: 'SAD', label: 'Sad', icon: Frown },
  { key: 'LONELY', label: 'Lonely', icon: User },
  { key: 'STRESSED', label: 'Stressed', icon: Zap },
  { key: 'OVERWHELMED', label: 'Overwhelmed', icon: Layers },
  { key: 'HOPEFUL', label: 'Hopeful', icon: Sun },
  { key: 'GRATEFUL', label: 'Grateful', icon: Heart },
  { key: 'ANGRY', label: 'Angry', icon: Flame },
  { key: 'CONFUSED', label: 'Confused', icon: HelpCircle },
];
const TRANSLATIONS = ['NIV', 'KJV', 'NLT', 'ESV', 'NKJV', 'CSB'];

import { useUser } from '../UserContext';

export default function HomeScreen({ navigation }: any) {
  const { profile } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranslations, setShowTranslations] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [dailyVerse, setDailyVerse] = useState<Scripture | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDailyVerse();
    setRefreshing(false);
  };

  const fetchDailyVerse = async () => {
    try {
      const verse = await getVerseOfTheDay(profile?.preferred_translation || 'KJV');
      setDailyVerse(verse);
      setHasSaved(false);
    } catch (error) {
      console.error('Error fetching daily verse:', error);
    }
  };

  const handleSave = async () => {
    if (!profile || !dailyVerse || isSaving || hasSaved) return;
    
    setIsSaving(true);
    try {
      await saveScripture(
        profile.id, 
        dailyVerse, 
        profile.preferred_translation || 'KJV',
        'Daily Verse'
      );
      setHasSaved(true);
    } catch (error) {
      console.error('Error saving scripture:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchDailyVerse();
  }, [profile?.preferred_translation]);

  const handleTranslationSelect = async (t: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from('profiles')
      .update({ preferred_translation: t })
      .eq('id', profile.id);
    if (!error) {
      setShowTranslations(false);
    }
  };

  const handleReflect = async () => {
    setLoadingReflection(true);
    try {
      const verse = dailyVerse?.verse || "Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty.";
      const ref = dailyVerse?.reference || "Psalm 91:1";
      const text = await getVerseReflection(verse, ref);
      setReflection(text);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingReflection(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Mood', { mood: searchQuery });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Section */}
        <View style={styles.searchSection}>
          <View style={styles.heroHeader}>
            <Text style={styles.mainTitle}>BIBLE MOOD SEARCH</Text>
            <View style={styles.titleUnderline} />
          </View>
          
          <View style={styles.versionRow}>
            <Text style={styles.headerLabel}>SELECT TRANSLATION</Text>
            <TouchableOpacity 
              style={styles.translationSelector}
              onPress={() => setShowTranslations(!showTranslations)}
            >
              <Globe size={12} color="#d4af37" />
              <Text style={styles.translationText}>{profile?.preferred_translation || 'KJV'}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            
            {showTranslations && (
              <View style={styles.translationDropdown}>
                <ScrollView style={{ maxHeight: 200 }}>
                  {TRANSLATIONS.map(t => (
                    <TouchableOpacity 
                      key={t} 
                      style={styles.dropdownItem}
                      onPress={() => handleTranslationSelect(t)}
                    >
                      <Text style={[
                        styles.dropdownText,
                        profile?.preferred_translation === t && styles.dropdownTextActive
                      ]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.searchBar}>
            <View style={styles.searchIconContainer}>
              <Search size={16} color="#d4af37" />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="I am feeling..."
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>

          <View style={styles.moodPills}>
            {MOOD_CONFIG.map((m) => (
              <MotionView
                key={m.key}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(212, 175, 55, 0.05)' }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '31.5%', marginBottom: 12 }}
              >
                <TouchableOpacity 
                  style={styles.moodPill}
                  onPress={() => navigation.navigate('Mood', { mood: m.key })}
                >
                  <m.icon size={16} color="#d4af37" style={{ marginBottom: 6 }} />
                  <Text style={styles.moodPillText}>{m.label}</Text>
                </TouchableOpacity>
              </MotionView>
            ))}
          </View>
        </View>

        {/* Middle Navigation Bar as seen in screenshot */}
        <View style={styles.middleNavBar}>
          <TouchableOpacity style={styles.navIcon}>
            <Mic size={20} color="#d4af37" />
          </TouchableOpacity>
          <Text style={styles.bmsLogo}>B M S</Text>
          <TouchableOpacity style={styles.navIcon} onPress={() => navigation.navigate('Profile')}>
            <User size={20} color="#d4af37" />
          </TouchableOpacity>
        </View>

        <View style={styles.verseCard}>
          <Text style={styles.verseLabel}>VERSE OF THE DAY</Text>
          <Text style={styles.verseText}>
            {dailyVerse?.verse || "Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty."}
          </Text>
          <Text style={styles.verseReference}>— {dailyVerse?.reference || "PSALM 91:1"} ({profile?.preferred_translation || 'KJV'})</Text>
          
          <View style={styles.verseActions}>
            <TouchableOpacity 
              style={[styles.saveButton, hasSaved && styles.saveButtonActive]} 
              onPress={handleSave}
              disabled={isSaving || hasSaved}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#0b1e3d" />
              ) : hasSaved ? (
                <View style={styles.saveButtonContent}>
                  <Check size={14} color="#10B981" style={{ marginRight: 6 }} />
                  <Text style={[styles.saveButtonText, { color: '#10B981' }]}>SAVED</Text>
                </View>
              ) : (
                <View style={styles.saveButtonContent}>
                  <Bookmark size={14} color="#0b1e3d" style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>SAVE TO MY LIST</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {showVideoGenerator ? (
            <VideoGenerator 
              title={dailyVerse?.reference || "Psalm 91:1"}
              prompt={`A cinematic, inspiring, and spiritually grounded visual accompaniment for the Bible verse: '${dailyVerse?.verse || "Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty."}' (${dailyVerse?.reference || "Psalm 91:1"}). High quality, peaceful, and reverent.`}
              onClose={() => setShowVideoGenerator(false)}
            />
          ) : (
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={() => setShowVideoGenerator(true)}
            >
              <View style={styles.reflectionButtonContent}>
                <Video size={14} color="#d4af37" style={{ marginRight: 8 }} />
                <Text style={styles.generateButtonText}>
                  GENERATE VISION
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {reflection ? (
            <MotionView
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ width: '100%' }}
            >
              <View style={styles.reflectionContainer}>
                <View style={styles.reflectionHeader}>
                  <Sparkles size={16} color="#d4af37" />
                  <Text style={styles.reflectionTitle}>DAVID'S REFLECTION</Text>
                </View>
                <Text style={styles.reflectionBody}>{reflection}</Text>
                <TouchableOpacity onPress={() => setReflection(null)} style={styles.closeReflection}>
                  <Text style={styles.closeReflectionText}>CLOSE</Text>
                </TouchableOpacity>
              </View>
            </MotionView>
          ) : (
            <TouchableOpacity 
              style={styles.reflectionButton} 
              onPress={handleReflect}
              disabled={loadingReflection}
            >
              {loadingReflection ? (
                <ActivityIndicator size="small" color="#0b1e3d" />
              ) : (
                <View style={styles.reflectionButtonContent}>
                  <Sparkles size={14} color="#0b1e3d" style={{ marginRight: 8 }} />
                  <Text style={styles.reflectionText}>
                    {"TAP FOR DAVID'S REFLECTION"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Proactive Voice Card (Optional feature, kept it subtle) */}
        <MotionView
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={styles.voiceProactiveCard}
        >
            <View style={styles.voiceCardContent}>
              <View style={styles.voiceIconContainer}>
                <Mic size={24} color="#d4af37" />
              </View>
              <View style={styles.voiceTextContainer}>
                <Text style={styles.voiceCardTitle}>Want to talk?</Text>
                <Text style={styles.voiceCardSubtitle}>David is ready to listen and encourage you in real-time.</Text>
              </View>
              <TouchableOpacity 
                style={styles.voiceStartButton}
                onPress={() => navigation.navigate('Voice')}
              >
                <Text style={styles.voiceStartButtonText}>START VOICE</Text>
              </TouchableOpacity>
            </View>
          </MotionView>
        
        <View style={styles.footer}>
          {profile?.email === OWNER_EMAIL && (
            <Text style={styles.ownerBadge}>OWNER ACCOUNT</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#051020',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 40,
    paddingBottom: 40,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  searchSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  heroHeader: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  mainTitle: {
    fontSize: 32,
    color: '#d4af37',
    fontFamily: 'Playfair Display',
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  titleUnderline: {
    width: 60,
    height: 1,
    backgroundColor: '#d4af37',
    marginTop: 10,
    opacity: 0.3,
  },
  versionRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    zIndex: 1000,
  },
  headerLabel: {
    fontSize: 9,
    color: 'rgba(212, 175, 55, 0.6)',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  translationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  translationText: {
    color: '#d4af37',
    fontSize: 13,
    fontWeight: 'bold',
    marginHorizontal: 10,
    letterSpacing: 1,
  },
  dropdownArrow: {
    color: '#d4af37',
    fontSize: 8,
    opacity: 0.5,
  },
  translationDropdown: {
    position: 'absolute',
    top: 75,
    backgroundColor: '#0a1a30',
    borderRadius: 15,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    width: 140,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.05)',
  },
  dropdownText: {
    color: 'rgba(212, 175, 55, 0.5)',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  dropdownTextActive: {
    color: '#d4af37',
  },
  searchBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 30,
    paddingLeft: 18,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    marginBottom: 30,
    height: 54,
  },
  searchInput: {
    flex: 1,
    height: 54,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
    paddingLeft: 12,
  },
  searchIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  moodPill: {
    backgroundColor: 'rgba(10, 26, 48, 0.5)',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    width: '100%',
  },
  moodPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  middleNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a1a30',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    marginBottom: 40,
    width: '100%',
  },
  navIcon: {
    padding: 8,
  },
  bmsLogo: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  verseCard: {
    backgroundColor: '#0a1a30',
    marginHorizontal: 0,
    borderRadius: 0,
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  verseLabel: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 30,
    opacity: 0.6,
  },
  verseText: {
    fontSize: 22,
    color: '#ffffff',
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 24,
  },
  verseReference: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 40,
  },
  verseActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    minWidth: 180,
    alignItems: 'center',
  },
  saveButtonActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#051020',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  generateButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#d4af37',
    minWidth: 180,
    alignItems: 'center',
    marginTop: 10,
  },
  generateButtonText: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  reflectionButton: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  reflectionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reflectionText: {
    color: '#051020',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  reflectionContainer: {
    marginTop: 30,
    padding: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    width: '100%',
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  reflectionTitle: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginLeft: 12,
  },
  reflectionBody: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    fontFamily: 'Playfair Display',
    fontStyle: 'italic',
    opacity: 0.9,
  },
  closeReflection: {
    marginTop: 30,
    padding: 8,
  },
  closeReflectionText: {
    color: 'rgba(212, 175, 55, 0.3)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 60,
    alignItems: 'center',
    paddingBottom: 40,
  },
  ownerBadge: {
    color: '#d4af37',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.3,
  },
  voiceProactiveCard: {
    marginHorizontal: 20,
    marginTop: 40,
    backgroundColor: 'rgba(10, 26, 48, 0.8)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  voiceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  voiceTextContainer: {
    flex: 1,
  },
  voiceCardTitle: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Playfair Display',
  },
  voiceCardSubtitle: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
    lineHeight: 18,
  },
  voiceStartButton: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 10,
  },
  voiceStartButtonText: {
    color: '#051020',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

