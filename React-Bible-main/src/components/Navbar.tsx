import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Menu, User, Bell } from 'lucide-react';
import { APP_NAME } from '../constants';

interface NavbarProps {
  onProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onProfile }) => {
  return (
    <View style={styles.navbar}>
      <TouchableOpacity style={styles.iconButton}>
        <Menu size={20} color="#d4af37" />
      </TouchableOpacity>
      <View style={styles.center}>
        <Text style={styles.logoText}>BMS</Text>
      </View>
      <TouchableOpacity style={styles.iconButton} onPress={onProfile}>
        <User size={20} color="#d4af37" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 0,
    left: 0,
    right: 0,
    height: 55, // Reduced height for a sleeker look
    backgroundColor: '#0b1e3d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15, // Adjusted padding for better spacing
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    zIndex: 1000,
    // @ts-ignore
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },
  iconButton: {
    padding: 6, // Reduced padding for smaller buttons
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  logoText: {
    color: '#d4af37',
    fontSize: 16, // Slightly smaller font size
    fontWeight: '600', // Adjusted weight for elegance
    letterSpacing: 4,
    fontFamily: 'Cinzel',
  }
});
