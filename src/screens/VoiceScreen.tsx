import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { Mic, MicOff, Lock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import { hasProAccess } from '../utils/tier';

export default function VoiceScreen({ navigation }: any) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDavidThinking, setIsDavidThinking] = useState(false);
  const [isDavidSpeaking, setIsDavidSpeaking] = useState(false);
  const [hasKey, setHasKey] = useState(true);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [lastResponseText, setLastResponseText] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);

  const addLog = (msg: string) => {
    console.log(`[VoiceDebug] ${msg}`);
    setDebugLogs(prev => [msg, ...prev].slice(0, 20));
  };

  useEffect(() => {
    fetchProfile();
    checkApiKey();
    return () => {
      stopSession();
    };
  }, []);

  const checkApiKey = async () => {
    if ((window as any).aistudio) {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasKey(selected);
    }
  };

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    }
  };

  const getAudioContext = (sampleRate = 16000) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
      addLog(`AudioContext created (${sampleRate}Hz)`);
    }
    return audioContextRef.current;
  };

  const startSession = async () => {
    if (!hasProAccess(profile)) {
      alert('Voice chat is a Pro feature. Please upgrade to access.');
      return;
    }

    if (!hasKey && (window as any).aistudio) {
      await handleOpenKeySelector();
    }

    setIsConnecting(true);
    setError(null);
    addLog("Starting session...");
    try {
      const context = getAudioContext(16000);
      if (context.state === 'suspended') {
        await context.resume();
        addLog("AudioContext resumed");
      }

      const apiKey = 
        process.env.GEMINI_API_KEY || 
        (process.env as any).API_KEY || 
        (window as any).GEMINI_API_KEY || 
        "";
      
      addLog(`API Key present: ${!!apiKey}`);
      if (!apiKey) {
        setError("Gemini API Key is missing. Please set it in the Secrets panel.");
        setIsConnecting(false);
        return;
      }

      addLog(`Modality check: ${typeof Modality !== 'undefined' ? 'Modality exists' : 'Modality is UNDEFINED'}`);
      const audioModality = typeof Modality !== 'undefined' ? Modality.AUDIO : 'audio';
      addLog(`Using modality: ${audioModality}`);

      const ai = new GoogleGenAI({ apiKey });
      
      addLog("Starting Live connection (09-2025)...");
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [audioModality as any],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are David, a warm, compassionate AI Bible companion. This is a real-time voice conversation. Respond naturally and warmly. Keep responses concise (1-2 sentences).",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            addLog("WebSocket opened successfully");
            setIsConnected(true);
            setIsConnecting(false);
            startAudioCapture();
          },
          onmessage: async (message: any) => {
            if (message.setupComplete) {
              addLog("Model setup complete");
            }
            
            if (message.serverContent?.modelTurn) {
              addLog("Model response received (modelTurn)");
              setIsDavidThinking(false);
              const parts = message.serverContent.modelTurn.parts;
              if (parts) {
                addLog(`Response has ${parts.length} parts`);
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    addLog(`Audio chunk received: ${part.inlineData.data.length} base64 chars`);
                    audioQueue.current.push(part.inlineData.data);
                    processAudioQueue();
                  }
                  if (part.text) {
                    addLog(`Model text response: "${part.text}"`);
                    setLastResponseText(part.text);
                  }
                }
              } else {
                addLog("Response has no parts");
              }
            }

            if (message.serverContent?.userTurn) {
              const userText = message.serverContent.userTurn.parts?.[0]?.text;
              if (userText) {
                addLog(`User transcription: "${userText}"`);
              }
            }
            
            if (message.serverContent?.interrupted) {
              addLog("Model interrupted by user speech");
              setIsDavidSpeaking(false);
              setIsDavidThinking(false);
              audioQueue.current = [];
            }
          },
          onclose: (event: any) => {
            const reason = event?.reason || 'No reason';
            addLog(`WebSocket closed: ${reason}`);
            setIsConnected(false);
            setIsConnecting(false);
            setIsDavidThinking(false);
            setIsDavidSpeaking(false);
            stopAudioCapture();
          },
          onerror: (err: any) => {
            const errorMsg = err?.message || "Unknown WebSocket error";
            addLog(`WebSocket failed: ${errorMsg}`);
            console.error("Live API Error:", err);
            setIsConnecting(false);
            setIsConnected(false);
            setIsDavidThinking(false);
            setIsDavidSpeaking(false);
            setError(`Connection error: ${errorMsg}`);
            stopAudioCapture();
          }
        }
      });
      sessionRef.current = session;
    } catch (error: any) {
      addLog(`Setup error: ${error?.message}`);
      console.error(error);
      setIsConnecting(false);
      setIsConnected(false);
      setIsDavidThinking(false);
      setIsDavidSpeaking(false);
      setError(`Failed to connect: ${error?.message}`);
      stopAudioCapture();
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    stopAudioCapture();
    setIsConnected(false);
  };

  const startAudioCapture = async () => {
    addLog("Requesting microphone access...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog("Microphone access granted");
      
      const audioContext = getAudioContext(16000);
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      // Use 16000 for input as required by the API
      // Reduced buffer size to 1024 for more frequent updates
      const processor = audioContext.createScriptProcessor(1024, 1, 1);
      processorRef.current = processor;

      let silenceFrames = 0;
      const SILENCE_THRESHOLD = 0.001; // Very sensitive to ensure audio is sent
      const SILENCE_LIMIT = 30; 
      let lastSendTime = 0;

      processor.onaudioprocess = (e) => {
        if (sessionRef.current && isConnected && !isDavidSpeaking) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Simple silence detection
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) sum += Math.abs(inputData[i]);
          const average = sum / inputData.length;
          
          if (average > SILENCE_THRESHOLD) { 
            silenceFrames = 0;
            setIsDavidThinking(false);
            
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
            }
            
            const bytes = new Uint8Array(pcmData.buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64Data = btoa(binary);

            if (sessionRef.current) {
              sessionRef.current.sendRealtimeInput({
                media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
              
              const now = Date.now();
              if (now - lastSendTime > 2000) {
                addLog(`Audio chunk sent (${base64Data.length} chars)`);
                lastSendTime = now;
              }
            }
          } else {
            silenceFrames++;
            if (silenceFrames > SILENCE_LIMIT && !isDavidThinking && !isDavidSpeaking) {
              setIsDavidThinking(true);
            }
          }
        }
      };

      source.connect(processor);
      
      // Silent connection to destination to keep processor alive without feedback
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(audioContext.destination);
      
      setIsListening(true);
      addLog("Audio capture started");
    } catch (err: any) {
      addLog(`Mic error: ${err?.message}`);
      console.error("Microphone access denied:", err);
      setError("Microphone access is required for voice chat.");
    }
  };

  const stopAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
  };

  const nextStartTimeRef = useRef<number>(0);

  const processAudioQueue = async () => {
    if (isPlaying.current) {
      addLog("Queue already processing, skipping trigger");
      return;
    }
    if (audioQueue.current.length === 0) {
      addLog("Queue empty, nothing to process");
      return;
    }
    
    addLog(`Starting queue processing (${audioQueue.current.length} chunks)`);
    isPlaying.current = true;
    setIsDavidSpeaking(true);
    setIsDavidThinking(false);
    
    // Reset nextStartTime when starting a new response
    const context = getAudioContext();
    nextStartTimeRef.current = context.currentTime + 0.1;
    
    try {
      while (audioQueue.current.length > 0) {
        const chunk = audioQueue.current.shift();
        if (chunk) {
          addLog(`Playing chunk from queue...`);
          await playAudio(chunk);
        }
      }
      addLog("Queue processing finished");
    } catch (err) {
      addLog(`Queue processing error: ${err}`);
      console.error("Queue error:", err);
    } finally {
      isPlaying.current = false;
      setIsDavidSpeaking(false);
    }
  };

  const playAudio = async (base64Data: string): Promise<void> => {
    if (!base64Data) return;
    
    addLog(`playAudio called with ${base64Data.length} chars`);
    const context = getAudioContext(16000);
    
    if (context.state === 'suspended') {
      addLog("Resuming suspended AudioContext...");
      await context.resume();
    }

    return new Promise((resolve) => {
      try {
        addLog("Decoding base64 audio...");
        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        
        if (bytes.length < 2) {
          addLog("Chunk too small, skipping");
          resolve();
          return;
        }

        addLog(`Decoded ${bytes.length} bytes. Converting to Float32...`);
        // Ensure the buffer length is even for Int16Array
        const pcmData = new Int16Array(bytes.buffer.slice(0, bytes.buffer.byteLength - (bytes.buffer.byteLength % 2)));
        const float32Data = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          float32Data[i] = pcmData[i] / 32768.0;
        }
        
        // Gemini Live returns 24kHz PCM
        addLog(`Creating AudioBuffer: 1 channel, ${float32Data.length} samples, 24000Hz`);
        const audioBuffer = context.createBuffer(1, float32Data.length, 24000);
        audioBuffer.getChannelData(0).set(float32Data);
        
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(context.destination);
        
        // Gapless scheduling
        const currentTime = context.currentTime;
        if (nextStartTimeRef.current < currentTime) {
          nextStartTimeRef.current = currentTime + 0.05;
        }
        
        source.onended = () => {
          addLog("Chunk playback ended");
          resolve();
        };
        
        addLog(`Scheduling source playback at ${nextStartTimeRef.current.toFixed(3)} (current: ${currentTime.toFixed(3)})`);
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;
      } catch (err) {
        addLog(`Playback error: ${err}`);
        console.error("Error playing audio chunk:", err);
        resolve();
      }
    });
  };

  const testAudio = async () => {
    addLog("Starting audio output test...");
    try {
      const context = getAudioContext(16000);
      addLog(`Context state: ${context.state}`);
      await context.resume();
      addLog(`Context state after resume: ${context.state}`);
      
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, context.currentTime); // A4
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      addLog("Starting oscillator...");
      oscillator.start();
      oscillator.stop(context.currentTime + 0.5);
      
      alert("Test sound played. If you didn't hear a beep, please check your device volume and browser permissions.");
    } catch (err) {
      addLog(`Test audio error: ${err}`);
      console.error(err);
    }
  };

  if (!hasProAccess(profile)) {
    return (
      <View style={styles.lockedContainer}>
        <View style={styles.lockCard}>
          <Lock color="#4F46E5" size={48} style={{ marginBottom: 20 }} />
          <Text style={styles.lockTitle}>Pro Feature</Text>
          <Text style={styles.lockText}>
            Upgrade to Pro to experience real-time voice conversations with David.
          </Text>
          <TouchableOpacity 
            style={styles.upgradeButton} 
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles color="#4F46E5" size={24} />
        <Text style={styles.title}>Voice with David</Text>
        <Text style={styles.subtitle}>Real-time Spiritual Companion</Text>
      </View>

      <View style={styles.visualizerContainer}>
        <AnimatePresence>
          {isConnected && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: isDavidSpeaking ? [1, 1.3, 1] : isListening ? [1, 1.1, 1] : 1,
                opacity: isDavidSpeaking ? [0.3, 0.6, 0.3] : isListening ? [0.2, 0.4, 0.2] : 0.1,
              }}
              transition={{ 
                duration: isDavidSpeaking ? 1.5 : 3, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              style={{
                position: 'absolute',
                width: 180,
                height: 180,
                borderRadius: '50%',
                backgroundColor: '#d4af37',
                filter: 'blur(20px)',
                zIndex: 1,
              }}
            />
          )}
        </AnimatePresence>
        
        <View style={[styles.mainCircle, isConnected && styles.mainActive]}>
          {isConnected ? (
            isDavidSpeaking ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Sparkles color="#d4af37" size={48} />
              </motion.div>
            ) : (
              <Mic color="#fff" size={48} />
            )
          ) : (
            <MicOff color="#9CA3AF" size={48} />
          )}
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isConnecting ? "Connecting..." : isDavidSpeaking ? "David is speaking..." : isDavidThinking ? "David is thinking..." : isConnected ? "David is listening..." : "Tap to start conversation"}
        </Text>
      </View>

      {lastResponseText && isConnected && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.textFallbackContainer}
        >
          <Text style={styles.textFallbackLabel}>David says:</Text>
          <Text style={styles.textFallbackContent}>{lastResponseText}</Text>
        </motion.div>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!hasKey && (
        <TouchableOpacity style={styles.keyWarning} onPress={handleOpenKeySelector}>
          <Text style={styles.keyWarningText}>⚠️ API Key Setup Required (Tap here)</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={[styles.actionButton, isConnected ? styles.stopButton : styles.startButton]} 
        onPress={isConnected ? stopSession : startSession}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.actionButtonText}>{isConnected ? "End Session" : "Start Conversation"}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.debugToggleContainer}>
        <TouchableOpacity onPress={() => setShowDebug(!showDebug)}>
          <Text style={styles.debugToggleText}>{showDebug ? "Hide Debug" : "Show Debug"}</Text>
        </TouchableOpacity>
      </View>

      {showDebug && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>Debug Logs</Text>
          <ScrollView style={styles.debugScroll}>
            {debugLogs.map((log, i) => (
              <Text key={i} style={styles.debugLog}>{`> ${log}`}</Text>
            ))}
          </ScrollView>
        </View>
      )}

      {!isConnected && !isConnecting && (
        <TouchableOpacity style={styles.testButton} onPress={testAudio}>
          <Text style={styles.testButtonText}>Test Audio Output</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.disclaimer}>
        David is an AI spiritual companion. For professional guidance or pastoral care, please consult your local church or a qualified advisor.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d4af37',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#f5d77a',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  visualizerContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  mainCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0b1e3d',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#d4af37',
  },
  mainActive: {
    backgroundColor: '#0f2a52',
    borderColor: '#f5d77a',
  },
  pulseCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    zIndex: 1,
  },
  pulseActive: {
    // In a real app we'd animate this
    transform: [{ scale: 1.2 }],
    opacity: 0.5,
  },
  statusContainer: {
    marginBottom: 40,
  },
  statusText: {
    fontSize: 14,
    color: '#f5d77a',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  keyWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  keyWarningText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionButton: {
    width: '100%',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
  },
  startButton: {
    backgroundColor: '#0b1e3d',
    borderColor: '#d4af37',
  },
  stopButton: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  disclaimer: {
    marginTop: 20,
    fontSize: 10,
    color: 'rgba(212, 175, 55, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  testButton: {
    marginTop: 15,
    padding: 10,
  },
  testButtonText: {
    color: '#f5d77a',
    fontSize: 10,
    textDecorationLine: 'underline',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  textFallbackContainer: {
    backgroundColor: 'rgba(15, 42, 82, 0.6)',
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  textFallbackLabel: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  textFallbackContent: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  debugToggleContainer: {
    marginTop: 20,
  },
  debugToggleText: {
    color: 'rgba(212, 175, 55, 0.4)',
    fontSize: 10,
    textDecorationLine: 'underline',
    textTransform: 'uppercase',
  },
  debugPanel: {
    width: '100%',
    height: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  debugTitle: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  debugScroll: {
    flex: 1,
  },
  debugLog: {
    color: '#00ff00',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
  lockedContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  lockCard: {
    backgroundColor: '#0f2a52',
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#d4af37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  lockText: {
    fontSize: 14,
    color: '#f5d77a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  upgradeButton: {
    backgroundColor: '#0b1e3d',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  upgradeButtonText: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
