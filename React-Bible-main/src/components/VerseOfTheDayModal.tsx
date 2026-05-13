import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { X, Quote } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { Scripture } from '../types';

const MotionView = motion(View);

interface VerseOfTheDayModalProps {
  visible: boolean;
  onClose: () => void;
  verse: Scripture | null;
}

export const VerseOfTheDayModal: React.FC<VerseOfTheDayModalProps> = ({ visible, onClose, verse }) => {
  if (!verse) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <MotionView
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={styles.modalContainer}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#d4af37" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Quote size={40} color="#d4af37" />
          </View>

          <Text style={styles.title}>Verse of the Day</Text>
          
          <View style={styles.verseCard}>
            <Text style={styles.verseText}>"{verse.verse}"</Text>
            <Text style={styles.reference}>{verse.reference}</Text>
          </View>

          <Text style={styles.explanation}>{verse.explanation}</Text>

          <TouchableOpacity style={styles.actionButton} onPress={onClose}>
            <Text style={styles.actionButtonText}>Amen</Text>
          </TouchableOpacity>
        </MotionView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#0f2a52',
    borderRadius: 32,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4af37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: 25,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: 'Playfair Display',
  },
  verseCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    padding: 25,
    borderRadius: 20,
    width: '100%',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#d4af37',
  },
  verseText: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 28,
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'Playfair Display',
  },
  reference: {
    fontSize: 14,
    color: '#d4af37',
    marginTop: 15,
    textAlign: 'right',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  explanation: {
    fontSize: 14,
    color: '#f5d77a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  actionButton: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#0b1e3d',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
