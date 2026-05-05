import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { supabase } from '../services/supabase';
<<<<<<< HEAD
import { Profile } from '../types';
import { LogOut, CreditCard, Shield, CheckCircle2, AlertCircle, Lock, Star, Bookmark, Trash2, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { createCheckoutSession } from '../services/stripe';
import { OWNER_EMAIL, hasProAccess } from '../utils/tier';
import { PLANS } from '../constants';
import { getSavedScriptures, toggleMemorized, deleteSavedScripture, updateScriptureCategory } from '../services/supabase';
import { SavedScripture } from '../types';

import { useUser } from '../UserContext';

export default function ProfileScreen({ route, navigation }: { route?: { params?: any }, navigation?: any }) {
  const { profile, refreshProfile, signOut } = useUser();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [showSavedScriptures, setShowSavedScriptures] = useState(false);
  const [savedScriptures, setSavedScriptures] = useState<SavedScripture[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const hasHandledRedirect = useRef(false);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const pricingRef = useRef<View>(null);

  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isActivating && profile?.subscription_tier === 'pro') {
      console.log('[StripeDebug] Pro tier detected! Stopping polling.');
      setIsActivating(false);
      setStatusMessage({ text: 'Activation complete! Welcome to the Pro family.', type: 'success' });
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    }
  }, [isActivating, profile?.subscription_tier]);
=======
import { LogOut, CheckCircle2, AlertCircle, Lock, Star, Shield, CreditCard, RefreshCw } from 'lucide-react';
import { createCheckoutSession } from '../services/stripe';
import { OWNER_EMAIL, hasProAccess } from '../utils/tier';
import { PLANS } from '../constants';
import { useUser } from '../UserContext';

const MAX_CONFIRMATION_ATTEMPTS = 15;
const CONFIRMATION_RETRY_DELAY_MS = 2000;

type StatusMessage = {
  text: string;
  type: 'success' | 'error' | 'info';
};

type ConfirmationState = 'idle' | 'checking' | 'confirmed' | 'timed_out';

type ProfileScreenProps = {
  route?: {
    params?: {
      success?: boolean;
      canceled?: boolean;
    };
  };
};

export default function ProfileScreen({ route }: ProfileScreenProps) {
  const { profile, refreshProfile, signOut } = useUser();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>('idle');
  const [confirmationAttempts, setConfirmationAttempts] = useState(0);
  const hasHandledRedirect = useRef(false);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathCleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSuccessRedirect = Boolean(route?.params?.success);
  const isCanceledRedirect = Boolean(route?.params?.canceled);
  const isBusy = loading || confirmationState === 'checking';

  const clearPollingTimeout = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  };

  const clearPathCleanupTimeout = () => {
    if (pathCleanupTimeoutRef.current) {
      clearTimeout(pathCleanupTimeoutRef.current);
      pathCleanupTimeoutRef.current = null;
    }
  };

  const replaceProfilePath = () => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/profile') {
      window.history.replaceState({}, document.title, '/profile');
    }
  };

  useEffect(() => {
    return () => {
      clearPollingTimeout();
      clearPathCleanupTimeout();
    };
  }, []);

  const confirmSubscription = async () => {
    clearPollingTimeout();
    clearPathCleanupTimeout();
    setConfirmationState('checking');
    setConfirmationAttempts(0);
    setStatusMessage(null);

    let attempt = 0;

    const checkStatus = async () => {
      attempt += 1;
      setConfirmationAttempts(attempt);
      console.log(`[ProfileScreen] Confirming Stripe upgrade. Attempt ${attempt}/${MAX_CONFIRMATION_ATTEMPTS}`);

      try {
        const latestProfile = await refreshProfile(false);
        const latestTier = latestProfile?.subscription_tier;

        if (latestTier === 'pro' || latestTier === 'owner') {
          console.log('[ProfileScreen] Pro access confirmed from refreshProfile response.');
          setConfirmationState('confirmed');
          setStatusMessage({
            text: 'Subscription confirmed. Your Pro access is now active.',
            type: 'success',
          });
          pathCleanupTimeoutRef.current = setTimeout(() => {
            replaceProfilePath();
          }, 1500);
          return;
        }
      } catch (error) {
        console.error('[ProfileScreen] Subscription confirmation refresh failed:', error);
      }

      if (attempt >= MAX_CONFIRMATION_ATTEMPTS) {
        console.warn('[ProfileScreen] Subscription confirmation timed out.');
        setConfirmationState('timed_out');
        setStatusMessage({
          text: 'Your payment succeeded, but Pro access is still syncing. Tap refresh below to check again.',
          type: 'info',
        });
        replaceProfilePath();
        return;
      }

      pollingTimeoutRef.current = setTimeout(() => {
        void checkStatus();
      }, CONFIRMATION_RETRY_DELAY_MS);
    };

    await checkStatus();
  };

  useEffect(() => {
    if (confirmationState !== 'checking') return;

    if (profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'owner') {
      clearPollingTimeout();
      setConfirmationState('confirmed');
      setStatusMessage({
        text: 'Subscription confirmed. Your Pro access is now active.',
        type: 'success',
      });
      pathCleanupTimeoutRef.current = setTimeout(() => {
        replaceProfilePath();
      }, 1500);
    }
  }, [confirmationState, profile?.subscription_tier]);

  useEffect(() => {
    if (hasHandledRedirect.current) return;
    if (!isSuccessRedirect && !isCanceledRedirect) return;
>>>>>>> 61252ec (Update profile subscription confirmation flow)

  useEffect(() => {
    if (route?.params?.showPricing && !showSavedScriptures) {
      setTimeout(() => {
        pricingRef.current?.measureLayout(
          (scrollViewRef.current as any).getInnerViewNode(),
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
          },
          () => {}
        );
      }, 500);
    }
  }, [route?.params?.showPricing, showSavedScriptures]);

<<<<<<< HEAD
  useEffect(() => {
    // Return early if we've already handled this redirect in this component instance
    if (hasHandledRedirect.current) return;

    // Check for URL parameters (success/canceled)
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success') === 'true' || route?.params?.success || route?.params?.paymentSuccess;
    const canceled = urlParams.get('canceled') === 'true' || route?.params?.canceled;
    const showPricing = route?.params?.showPricing;

    if (success || canceled) {
      console.log(`[StripeDebug] Handling Stripe redirect. Success: ${!!success}, Canceled: ${!!canceled}`);
      
      // Mark as handled to prevent re-triggering within this lifecycle
      hasHandledRedirect.current = true;

      // Update state based on parameters
      if (success) {
        if (profile?.subscription_tier !== 'pro') {
          setIsActivating(true);
          setStatusMessage({ text: 'Payment received! Activating your Pro plan...', type: 'info' });
          
          // Start polling for subscription update
          let attempts = 0;
          const maxAttempts = 20; // 20 attempts * 3 seconds = 60 seconds
          
          pollingInterval.current = setInterval(async () => {
            attempts++;
            console.log(`[StripeDebug] Polling subscription status (Attempt ${attempts}/${maxAttempts})...`);
            
            // Call fetch directly to avoid setting global loading state if desired
            // Use background refresh to avoid full-screen loader
            await refreshProfile(false);
            
            if (attempts >= maxAttempts) {
              if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
                pollingInterval.current = null;
              }
              setIsActivating(false);
              setStatusMessage({ 
                text: 'Activation is taking a bit longer than expected. It will update automatically in a few moments.', 
                type: 'info' 
              });
            }
          }, 3000);
        } else {
          setStatusMessage({ text: 'Subscription updated successfully! Welcome to the Pro family.', type: 'success' });
        }
      } else if (canceled) {
        setStatusMessage({ text: 'Checkout canceled. No changes were made.', type: 'info' });
      }

      // 1. Clear Params from React Navigation state if possible
      if (navigation && navigation.setParams) {
        navigation.setParams({ success: undefined, canceled: undefined });
      }

      // 2. Clear params from Browser URL bar without reload
      if (typeof window !== 'undefined' && window.history) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, [route?.params, refreshProfile, navigation]);
=======
    if (isCanceledRedirect) {
      setStatusMessage({ text: 'Checkout canceled. No changes were made.', type: 'info' });
      replaceProfilePath();
      return;
    }

    void confirmSubscription();
  }, [isSuccessRedirect, isCanceledRedirect, refreshProfile]);
>>>>>>> 61252ec (Update profile subscription confirmation flow)

  const handleLogout = async () => {
    await signOut();
  };

  useEffect(() => {
    if (showSavedScriptures && profile) {
      fetchSavedScriptures();
    }
  }, [showSavedScriptures, profile]);

  const fetchSavedScriptures = async () => {
    if (!profile) return;
    setLoadingSaved(true);
    try {
      const data = await getSavedScriptures(profile.id);
      setSavedScriptures(data);
    } catch (error: any) {
      console.error('Error fetching saved scriptures:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleToggleMemorized = async (item: SavedScripture) => {
    try {
      await toggleMemorized(item.id, !item.is_memorized);
      setSavedScriptures(prev => prev.map(s => s.id === item.id ? { ...s, is_memorized: !s.is_memorized } : s));
    } catch (error) {
      console.error('Error toggling memorized:', error);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    Alert.alert(
      'Delete Scripture',
      'Are you sure you want to remove this verse from your list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavedScripture(id);
              setSavedScriptures(prev => prev.filter(s => s.id !== id));
            } catch (error) {
              console.error('Error deleting scripture:', error);
            }
          }
        }
      ]
    );
  };

  const handleUpgrade = async (tierId: string) => {
    if (!profile) return;

    setLoading(true);
    setStatusMessage(null);
<<<<<<< HEAD
    
    const plan = Object.values(PLANS).find(p => p.id === tierId);
    
=======

    const plan = Object.values(PLANS).find((candidate) => candidate.id === tierId);
>>>>>>> 61252ec (Update profile subscription confirmation flow)
    console.log(`[StripeDebug] Upgrade button clicked: ${tierId}`);
    
    try {
      if (!plan || !plan.priceId) {
        throw new Error(`Price ID for ${tierId} plan is not configured.`);
      }

      await createCheckoutSession(plan.priceId);
    } catch (error: any) {
      console.error(`[StripeDebug] Upgrade error: ${error.message}`);
      setStatusMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (field: string, value: any) => {
    if (!profile) return;

    setLoading(true);

    try {
<<<<<<< HEAD
      const { error } = await supabase
=======
      const { error } = await supabase!
>>>>>>> 61252ec (Update profile subscription confirmation flow)
        .from('profiles')
        .update({ [field]: value })
        .eq('id', profile.id);
      
      if (error) throw error;

      await refreshProfile(false);
      setStatusMessage({ text: 'Preferences updated.', type: 'success' });
    } catch (error: any) {
      setStatusMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const bannerStyle =
    statusMessage?.type === 'success'
      ? styles.successBanner
      : statusMessage?.type === 'error'
        ? styles.errorBanner
        : styles.infoBanner;

  const bannerTextStyle =
    statusMessage?.type === 'success'
      ? styles.successText
      : statusMessage?.type === 'error'
        ? styles.errorText
        : styles.infoText;

  const showConfirmationCard = isSuccessRedirect || confirmationState !== 'idle';

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container} 
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        {isActivating && (
          <View style={styles.activatingLoader}>
            <ActivityIndicator size="small" color="#d4af37" />
            <Text style={styles.activatingText}>ACTIVATING PRO FEATURES...</Text>
          </View>
        )}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.email?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>
            {profile?.email === OWNER_EMAIL ? 'OWNER (FULL ACCESS)' : profile?.subscription_tier?.toUpperCase() || 'FREE'}
          </Text>
        </View>
      </View>

<<<<<<< HEAD
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, !showSavedScriptures && styles.tabActive]} 
          onPress={() => setShowSavedScriptures(false)}
        >
          <Text style={[styles.tabText, !showSavedScriptures && styles.tabTextActive]}>SETTINGS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, showSavedScriptures && styles.tabActive]} 
          onPress={() => setShowSavedScriptures(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Bookmark size={12} color={showSavedScriptures ? '#d4af37' : 'rgba(212, 175, 55, 0.4)'} />
            <Text style={[styles.tabText, showSavedScriptures && styles.tabTextActive]}>SAVED</Text>
          </View>
        </TouchableOpacity>
      </View>

      {showSavedScriptures ? (
        <View style={styles.savedSection}>
          <View style={styles.savedHeader}>
            <Text style={styles.sectionTitle}>My Saved Scriptures</Text>
            <TouchableOpacity onPress={fetchSavedScriptures} disabled={loadingSaved}>
              <Text style={{ fontSize: 10, color: '#d4af37', fontWeight: 'bold' }}>REFRESH</Text>
            </TouchableOpacity>
          </View>

          {loadingSaved ? (
            <ActivityIndicator size="large" color="#d4af37" style={{ marginTop: 40 }} />
          ) : savedScriptures.length === 0 ? (
            <View style={styles.emptySaved}>
              <Bookmark size={40} color="rgba(212, 175, 55, 0.1)" style={{ marginBottom: 15 }} />
              <Text style={styles.emptySavedText}>Your saved list is empty.</Text>
              <Text style={styles.emptySavedSubtext}>Verses you save from search or the home screen will appear here.</Text>
            </View>
          ) : (
            savedScriptures.map((item) => (
              <View key={item.id} style={[styles.savedCard, item.is_memorized && styles.memorizedCard]}>
                <TouchableOpacity 
                  style={styles.savedCardHeader}
                  onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <View style={styles.savedCardTitleRow}>
                    <View style={[styles.memorizedDot, { backgroundColor: item.is_memorized ? '#10B981' : 'rgba(212, 175, 55, 0.3)' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.savedReference}>{item.reference}</Text>
                      <Text style={styles.savedCategory}>{item.category || 'Uncategorized'} • {item.version}</Text>
                    </View>
                    {expandedId === item.id ? <ChevronUp size={16} color="#d4af37" /> : <ChevronDown size={16} color="#d4af37" />}
                  </View>
                </TouchableOpacity>

                {expandedId === item.id && (
                  <View style={styles.savedCardContent}>
                    <Text style={styles.savedText}>"{item.text}"</Text>
                    
                    <View style={styles.categoryInputRow}>
                      <Text style={styles.categoryLabel}>CATEGORY</Text>
                      <TextInput 
                        style={styles.categoryInput}
                        value={item.category || ''}
                        onChangeText={(text) => {
                          setSavedScriptures(prev => prev.map(s => s.id === item.id ? { ...s, category: text } : s));
                        }}
                        onBlur={() => updateScriptureCategory(item.id, item.category || 'Uncategorized')}
                        placeholder="Add category..."
                        placeholderTextColor="rgba(212, 175, 55, 0.3)"
                      />
                    </View>
                    
                    <View style={styles.savedActions}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, item.is_memorized && styles.memorizedBtn]}
                        onPress={() => handleToggleMemorized(item)}
                      >
                        <Check size={14} color={item.is_memorized ? '#fff' : '#10B981'} />
                        <Text style={[styles.actionBtnText, item.is_memorized && { color: '#fff' }]}>
                          {item.is_memorized ? 'MEMORIZED' : 'MARK AS MEMORIZED'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => handleDeleteSaved(item.id)}
                      >
                        <Trash2 size={14} color="#EF4444" />
                        <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>REMOVE</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      ) : (
        <>
          {statusMessage && (
        <View style={[styles.statusBanner, styles[`${statusMessage.type}Banner`]]}>
          {statusMessage.type === 'error' ? <AlertCircle size={16} color="#ef4444" /> : <CheckCircle2 size={16} color={statusMessage.type === 'success' ? '#10B981' : '#d4af37'} />}
          <Text style={[styles.statusText, styles[`${statusMessage.type}Text`]]}>{statusMessage.text}</Text>
=======
      {showConfirmationCard && (
        <View style={styles.confirmationCard}>
          <View style={styles.confirmationIconWrap}>
            {confirmationState === 'checking' ? (
              <ActivityIndicator size="large" color="#d4af37" />
            ) : confirmationState === 'confirmed' ? (
              <CheckCircle2 size={44} color="#10B981" />
            ) : (
              <AlertCircle size={44} color="#d4af37" />
            )}
          </View>

          <Text style={styles.confirmationTitle}>
            {confirmationState === 'checking'
              ? 'Confirming Your Subscription'
              : confirmationState === 'confirmed'
                ? 'Pro Access Confirmed'
                : 'Still Syncing Your Upgrade'}
          </Text>

          <Text style={styles.confirmationText}>
            {confirmationState === 'checking'
              ? 'Stripe has returned successfully. We are refreshing your account and checking for your Pro tier now.'
              : confirmationState === 'confirmed'
                ? 'Your account is now unlocked. You can use Pro features immediately.'
                : 'Your payment completed, but the profile update has not appeared yet. This usually resolves shortly after the webhook finishes.'}
          </Text>

          {confirmationState === 'checking' && (
            <Text style={styles.confirmationMeta}>
              Attempt {confirmationAttempts} of {MAX_CONFIRMATION_ATTEMPTS}
            </Text>
          )}

          {confirmationState === 'timed_out' && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => void confirmSubscription()}
              disabled={isBusy}
            >
              <RefreshCw size={16} color="#0b1e3d" />
              <Text style={styles.refreshButtonText}>Refresh Subscription Status</Text>
            </TouchableOpacity>
          )}
>>>>>>> 61252ec (Update profile subscription confirmation flow)
        </View>
      )}

      {statusMessage && (
        <View style={[styles.statusBanner, bannerStyle]}>
          {statusMessage.type === 'error' ? (
            <AlertCircle size={16} color="#ef4444" />
          ) : (
            <CheckCircle2 size={16} color={statusMessage.type === 'success' ? '#10B981' : '#d4af37'} />
          )}
          <Text style={[styles.statusText, bannerTextStyle]}>{statusMessage.text}</Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Shield size={18} color="#d4af37" />
        <Text style={styles.sectionTitle}>AI Preferences</Text>
      </View>
      <View style={styles.settingsCard}>
        <Text style={styles.settingsLabel}>Response Length</Text>
        <View style={styles.optionsRow}>
          {['short', 'medium', 'long'].map((length) => {
            const isLocked = length !== 'short' && !hasProAccess(profile);
            const isSelected = profile?.preferred_response_length === length;

            return (
              <TouchableOpacity
                key={length}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonActive,
                  isLocked && styles.optionButtonDisabled,
                ]}
                onPress={() => !isLocked && updatePreference('preferred_response_length', length)}
                disabled={isBusy}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextActive,
                    isLocked && styles.optionTextDisabled,
                  ]}
                >
                  {length.toUpperCase()}
                </Text>
                {isLocked && <Lock size={10} color="rgba(212, 175, 55, 0.3)" style={{ marginTop: 2 }} />}
              </TouchableOpacity>
            );
          })}
        </View>
        {!hasProAccess(profile) && (
          <Text style={styles.settingsHint}>Upgrade to Pro to unlock medium and long responses.</Text>
        )}

        <View style={styles.divider} />

        <Text style={styles.settingsLabel}>Verse of the Day</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Daily Notifications</Text>
          <TouchableOpacity
            style={[styles.toggleSwitch, profile?.verse_of_the_day_enabled && styles.toggleSwitchActive]}
            onPress={() => updatePreference('verse_of_the_day_enabled', !profile?.verse_of_the_day_enabled)}
            disabled={isBusy}
          >
            <View style={[styles.toggleDot, profile?.verse_of_the_day_enabled && styles.toggleDotActive]} />
          </TouchableOpacity>
        </View>

        {profile?.verse_of_the_day_enabled && (
          <View style={styles.timePickerContainer}>
            <Text style={styles.timeLabel}>Notification Time</Text>
            <View style={styles.timeInputRow}>
              <TextInput
                style={styles.timeInput}
                value={profile?.verse_of_the_day_time || '08:00'}
                onChangeText={(text) => updatePreference('verse_of_the_day_time', text)}
                placeholder="HH:mm"
                placeholderTextColor="rgba(212, 175, 55, 0.3)"
                maxLength={5}
              />
              <Text style={styles.timeHint}>(24h format, for example 08:00)</Text>
            </View>
          </View>
        )}
      </View>

<<<<<<< HEAD
      <Text style={[styles.sectionTitle, { paddingLeft: 44 }]}>Your Benefits</Text>
      <View style={[styles.benefitsSummary, { paddingLeft: 16 }]}>
        <View style={styles.benefitItem}>
          <CheckCircle2 size={16} color="#10B981" />
          <Text style={styles.benefitText}>
            {profile?.subscription_tier === 'pro' ? 'Unlimited AI Chat with David' : '3 Mood Searches / Day'}
=======
      <View style={styles.sectionHeader}>
        <Shield size={18} color="#10B981" />
        <Text style={styles.sectionTitle}>Your Benefits</Text>
      </View>
      <View style={styles.benefitsSummary}>
        <View style={styles.benefitItem}>
          <CheckCircle2 size={16} color="#10B981" />
          <Text style={styles.benefitText}>
            {profile?.subscription_tier === 'pro'
              ? 'Unlimited AI Conversations'
              : profile?.subscription_tier === 'plus'
                ? 'Unlimited Mood Search'
                : '3 Mood Searches / Day'}
>>>>>>> 61252ec (Update profile subscription confirmation flow)
          </Text>
        </View>
        <View style={styles.benefitItem}>
          <CheckCircle2 size={16} color="#10B981" />
          <Text style={styles.benefitText}>
<<<<<<< HEAD
            {profile?.subscription_tier === 'pro' ? 'Live Voice Chat with David' : 'Standard AI Reflections'}
          </Text>
        </View>
        <View style={styles.benefitItem}>
          <CheckCircle2 size={16} color="#10B981" />
          <Text style={styles.benefitText}>
            {profile?.subscription_tier === 'pro' ? 'Mood-based Music and Reflections' : 'Daily Verse of the Day'}
=======
            {profile?.preferred_response_length === 'long'
              ? 'Comprehensive AI Reflections'
              : profile?.preferred_response_length === 'medium'
                ? 'Standard AI Reflections'
                : 'Concise AI Reflections'}
>>>>>>> 61252ec (Update profile subscription confirmation flow)
          </Text>
        </View>
        {profile?.subscription_tier === 'pro' && (
          <View style={styles.benefitItem}>
            <CheckCircle2 size={16} color="#10B981" />
            <Text style={styles.benefitText}>Deeper Scripture Insights & Ad-free</Text>
          </View>
        )}
      </View>

<<<<<<< HEAD
      <Text style={styles.sectionTitle} onLayout={(e) => {
        // Fallback for measurement if needed
      }} ref={pricingRef}>Subscription Plans</Text>
      
=======
      <View style={styles.sectionHeader}>
        <CreditCard size={18} color="#d4af37" />
        <Text style={styles.sectionTitle}>Subscription Plans</Text>
      </View>
>>>>>>> 61252ec (Update profile subscription confirmation flow)
      {Object.values(PLANS).map((plan) => {
        const currentTier = profile?.subscription_tier || 'free';
        const isOwner = profile?.email === OWNER_EMAIL;
        const isCurrentPlan = currentTier === plan.id;
<<<<<<< HEAD
        
        // Tier hierarchy: free < pro < owner
        const tierOrder = ['free', 'pro', 'owner'];
        const currentTierIndex = tierOrder.indexOf(isOwner ? 'owner' : currentTier);
        const planTierIndex = tierOrder.indexOf(plan.id);
        
=======
        const tierOrder = ['free', 'plus', 'pro', 'owner'];
        const currentTierIndex = tierOrder.indexOf(isOwner ? 'owner' : currentTier);
        const planTierIndex = tierOrder.indexOf(plan.id);
>>>>>>> 61252ec (Update profile subscription confirmation flow)
        const isIncluded = currentTierIndex >= planTierIndex;
        const canUpgrade = !isIncluded && plan.id !== 'free';

        return (
<<<<<<< HEAD
          <View key={plan.id} style={[
            styles.planCard, 
            plan.id === 'pro' && styles.proCard,
            isCurrentPlan && styles.currentPlanCard
          ]}>
=======
          <View
            key={plan.id}
            style={[
              styles.planCard,
              plan.id === 'pro' && styles.proCard,
              isCurrentPlan && styles.currentPlanCard,
            ]}
          >
>>>>>>> 61252ec (Update profile subscription confirmation flow)
            {plan.id === 'pro' && (
              <View style={styles.proBadge}>
                <Star size={10} color="#0b1e3d" fill="#0b1e3d" />
                <Text style={styles.proBadgeText}>BEST VALUE</Text>
              </View>
            )}
            
            {isCurrentPlan && (
              <View style={styles.currentBadge}>
                <CheckCircle2 size={10} color="#fff" />
                <Text style={styles.currentBadgeText}>ACTIVE</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planName, plan.id === 'pro' && styles.proText]}>{plan.name}</Text>
                <Text style={[styles.planSubtext, plan.id === 'pro' && styles.proMutedText]}>
                  {plan.id === 'free' ? 'Basic Access' : 'Full Experience'}
                </Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={[styles.planPrice, plan.id === 'pro' && styles.proText]}>{plan.price}</Text>
                <Text style={[styles.planInterval, plan.id === 'pro' && styles.proMutedText]}>/{plan.interval}</Text>
              </View>
            </View>

            <View style={styles.featureList}>
              {plan.features.map((feature) => (
                <View key={`${plan.id}-${feature}`} style={styles.featureItem}>
                  <CheckCircle2 color={plan.id === 'pro' ? '#fff' : '#10B981'} size={14} />
                  <Text style={[styles.featureText, plan.id === 'pro' && styles.proText]}>{feature}</Text>
                </View>
              ))}
            </View>

            {canUpgrade ? (
<<<<<<< HEAD
              <TouchableOpacity 
                style={[
                  styles.planButton, 
                  plan.id === 'pro' && styles.proButton
                ]} 
=======
              <TouchableOpacity
                style={[styles.planButton, plan.id === 'pro' && styles.proButton]}
>>>>>>> 61252ec (Update profile subscription confirmation flow)
                onPress={() => handleUpgrade(plan.id)}
                disabled={isBusy}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={plan.id === 'pro' ? '#0b1e3d' : '#d4af37'} />
                ) : (
<<<<<<< HEAD
                  <Text style={[
                    styles.planButtonText, 
                    plan.id === 'pro' && { color: '#0b1e3d' }
                  ]}>
=======
                  <Text style={[styles.planButtonText, plan.id === 'pro' && styles.proButtonText]}>
>>>>>>> 61252ec (Update profile subscription confirmation flow)
                    Upgrade to {plan.name.split(' ')[0]}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
<<<<<<< HEAD
              <View style={[
                styles.planButton, 
                styles.activePlanButton,
                plan.id === 'pro' && styles.activeProButton
              ]}>
                <Text style={[
                  styles.planButtonText,
                  plan.id === 'pro' && { color: '#fff' }
                ]}>
=======
              <View style={[styles.planButton, styles.activePlanButton, plan.id === 'pro' && styles.activeProButton]}>
                <Text style={[styles.planButtonText, plan.id === 'pro' && styles.proText]}>
>>>>>>> 61252ec (Update profile subscription confirmation flow)
                  {isCurrentPlan ? 'Current Plan' : 'Included'}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </>
  )}

  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut color="#EF4444" size={20} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#0f2a52',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  activatingLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  activatingText: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0b1e3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#d4af37',
  },
  email: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    opacity: 0.85,
  },
  tierBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d4af37',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  confirmationCard: {
    backgroundColor: 'rgba(15, 42, 82, 0.82)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    alignItems: 'center',
  },
  confirmationIconWrap: {
    marginBottom: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#d4af37',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  confirmationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.82)',
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmationMeta: {
    marginTop: 14,
    fontSize: 12,
    color: '#f5d77a',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  refreshButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d4af37',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  refreshButtonText: {
    color: '#0b1e3d',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  infoBanner: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  statusText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  successText: {
    color: '#10B981',
  },
  errorText: {
    color: '#ef4444',
  },
  infoText: {
    color: '#d4af37',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5d77a',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  settingsCard: {
    backgroundColor: '#0f2a52',
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  settingsLabel: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 14,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  optionButtonActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderColor: '#d4af37',
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(212, 175, 55, 0.6)',
    letterSpacing: 1,
  },
  optionTextActive: {
    color: '#d4af37',
  },
  optionTextDisabled: {
    color: 'rgba(212, 175, 55, 0.35)',
  },
  settingsHint: {
    marginTop: 14,
    fontSize: 11,
    color: 'rgba(212, 175, 55, 0.55)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    marginVertical: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#ffffff',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  toggleSwitchActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    borderColor: '#d4af37',
  },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(212, 175, 55, 0.45)',
  },
  toggleDotActive: {
    backgroundColor: '#d4af37',
    transform: [{ translateX: 20 }],
  },
  timePickerContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.12)',
  },
  timeLabel: {
    fontSize: 12,
    color: '#f5d77a',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  timeInput: {
    width: 90,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: '#d4af37',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeHint: {
    fontSize: 10,
    color: 'rgba(212, 175, 55, 0.45)',
    fontStyle: 'italic',
  },
  benefitsSummary: {
    backgroundColor: '#0f2a52',
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
  },
  planCard: {
    backgroundColor: '#0f2a52',
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    overflow: 'hidden',
  },
  proCard: {
    backgroundColor: '#0b1e3d',
    borderColor: '#d4af37',
  },
  currentPlanCard: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  proBadge: {
    position: 'absolute',
    top: 12,
    right: -30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d4af37',
    paddingHorizontal: 40,
    paddingVertical: 4,
    transform: [{ rotate: '45deg' }],
  },
  proBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#0b1e3d',
    textTransform: 'uppercase',
  },
  currentBadge: {
    position: 'absolute',
    top: 12,
    left: -30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 40,
    paddingVertical: 4,
    transform: [{ rotate: '-45deg' }],
  },
  currentBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  planSubtext: {
    marginTop: 2,
    fontSize: 11,
    color: 'rgba(212, 175, 55, 0.65)',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  planInterval: {
    fontSize: 12,
    color: 'rgba(212, 175, 55, 0.65)',
  },
  featureList: {
    gap: 10,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.92,
  },
  planButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  proButton: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  activePlanButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  activeProButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  planButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d4af37',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  proButtonText: {
    color: '#0b1e3d',
  },
  proText: {
    color: '#ffffff',
  },
  proMutedText: {
    color: 'rgba(255, 255, 255, 0.68)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: '#0f2a52',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  tabText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(212, 175, 55, 0.4)',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#d4af37',
  },
  savedSection: {
    marginBottom: 30,
  },
  savedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  emptySaved: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#0f2a52',
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  emptySavedText: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Playfair Display',
    marginBottom: 8,
  },
  emptySavedSubtext: {
    color: 'rgba(212, 175, 55, 0.5)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Playfair Display',
  },
  savedCard: {
    backgroundColor: '#0f2a52',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    overflow: 'hidden',
  },
  memorizedCard: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
  },
  savedCardHeader: {
    padding: 16,
  },
  savedCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memorizedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  savedReference: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Playfair Display',
  },
  savedCategory: {
    fontSize: 10,
    color: 'rgba(212, 175, 55, 0.6)',
    marginTop: 2,
    fontWeight: '600',
  },
  savedCardContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.05)',
  },
  savedText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 24,
    fontStyle: 'italic',
    fontFamily: 'Playfair Display',
    marginBottom: 16,
    marginTop: 16,
  },
  categoryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  categoryLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#d4af37',
    marginRight: 10,
    letterSpacing: 1,
  },
  categoryInput: {
    flex: 1,
    color: '#f5d77a',
    fontSize: 12,
    paddingVertical: 8,
    fontFamily: 'Playfair Display',
  },
  savedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  actionBtnText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: 'rgba(212, 175, 55, 0.8)',
  },
  memorizedBtn: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  deleteBtn: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
});
