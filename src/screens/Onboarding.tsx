import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronsRight, Headphones } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Main: undefined;
  ProfileSetup: undefined;
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      {/* Background Navy Gradient */}
      <LinearGradient
        colors={['#0A1428', '#060B18', '#03060C']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle Cyan Glow behind hero */}
      <View style={styles.glowCircle} />

      <View style={[styles.content, { paddingTop: Math.max(insets.top + 16, 40), paddingBottom: Math.max(insets.bottom + 20, 40) }]}>
        
        {/* Top App Name & Logo */}
        <View style={styles.brandRow}>
          <Image 
            source={require('../../assets/soniq-logo.png')} 
            style={styles.brandLogo} 
            resizeMode="contain" 
          />
          <Text style={styles.brandName}>SONIQ</Text>
        </View>

        {/* Hero Glowing Headphones */}
        <View style={styles.heroWrapper}>
          <Image
            source={require('../../assets/onboarding-headphones.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.titleLine1}>Start Your</Text>
          <Text style={styles.titleLine2}>Sonic Journey</Text>
          <Text style={styles.subtitle}>
            Dive into a world of music — millions of songs, custom playlists, and every genre you love.
          </Text>
        </View>

        {/* Call To Action Pill Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={() => navigation.replace('ProfileSetup')}
        >
          <View style={styles.arrowCircle}>
            <ChevronsRight color="#060B18" size={22} strokeWidth={2.8} />
          </View>
          <Text style={styles.ctaText}>Turn on your music</Text>
          <Headphones color={COLORS.accent.cyan} size={22} strokeWidth={2} />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  glowCircle: {
    position: 'absolute',
    top: height * 0.18,
    alignSelf: 'center',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandName: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  heroWrapper: {
    width: width * 0.78,
    height: width * 0.78,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 12,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  textSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
  },
  titleLine1: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
  },
  titleLine2: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.accent.cyan,
    textAlign: 'center',
    lineHeight: 40,
    marginTop: 2,
    textShadowColor: 'rgba(0, 212, 255, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 21,
    paddingHorizontal: SIZES.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 62,
    paddingHorizontal: 10,
    paddingRight: 20,
    backgroundColor: 'rgba(10, 20, 42, 0.85)',
    borderRadius: 31,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 255, 0.35)',
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  ctaText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
