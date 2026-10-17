import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
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
      <View style={[styles.content, { paddingTop: Math.max(insets.top + 16, 44), paddingBottom: Math.max(insets.bottom + 20, 36) }]}>
        
        {/* Top App Name & Logo */}
        <View style={styles.brandRow}>
          <Image 
            source={require('../../assets/soniq-logo.png')} 
            style={styles.brandLogo} 
            resizeMode="contain" 
          />
          <Text style={styles.brandName}>Sonic Cube</Text>
        </View>

        {/* Headphones Hero Image with top & bottom fade */}
        <View style={styles.heroWrapper}>
          <Image
            source={require('../../assets/ui/splash_headphones.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['#0D0D0D', 'transparent']}
            style={styles.topGradient}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', '#0D0D0D']}
            style={styles.bottomGradient}
            pointerEvents="none"
          />
        </View>

        {/* Text Section (Left-aligned) */}
        <View style={styles.textSection}>
          <Text style={styles.headline}>Start Your{'\n'}Sonic Journey</Text>
          <Text style={styles.subtitle}>
            Dive into a world of music — millions of songs, custom playlists, and every genre you love.
          </Text>
        </View>

        {/* Call To Action Pill Button: #1B1B1B with left white circle arrow */}
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={() => navigation.replace('ProfileSetup')}
        >
          <View style={styles.arrowCircle}>
            <ArrowRight color={COLORS.onWhite} size={22} strokeWidth={2.4} />
          </View>
          <Text style={styles.ctaText}>Get Started</Text>
          <View style={styles.arrowPlaceholder} />
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandName: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  heroWrapper: {
    width: width,
    height: Math.min(width * 0.95, height * 0.42),
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
  },
  textSection: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  headline: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.text.primary,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginTop: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 60,
    paddingHorizontal: 7,
    backgroundColor: COLORS.surface,
    borderRadius: 30,
  },
  arrowCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.activeWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowPlaceholder: {
    width: 46,
    height: 46,
  },
  ctaText: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: 0.2,
  },
});
