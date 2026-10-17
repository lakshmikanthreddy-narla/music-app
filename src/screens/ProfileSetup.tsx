import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { Gender } from '../services/LibraryService';
import { useLibrary } from '../hooks/useLibrary';

type RootStackParamList = { Main: undefined };

const GENDERS: { value: Gender; label: string; symbol: string }[] = [
  { value: 'male', label: 'Male', symbol: '♂' },
  { value: 'female', label: 'Female', symbol: '♀' },
  { value: 'unspecified', label: 'Prefer not to say', symbol: '✦' },
];

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { saveProfile } = useLibrary();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');

  const finish = () => {
    Keyboard.dismiss();
    saveProfile({ name: name.trim() || 'Antony Das', gender, completed: true });
    navigation.replace('Main');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { paddingTop: insets.top + SIZES.xl }]}>
        <LinearGradient
          colors={['#0A1326', '#060B18', '#040710']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Text style={styles.kicker}>STEP 2 OF 2</Text>
          <Text style={styles.title}>Who's listening?</Text>
          <Text style={styles.subtitle}>
            Personalize your experience on SONIQ. Stays on this device.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Antony Das"
            placeholderTextColor="#6B7C96"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={finish}
            maxLength={40}
          />

          <Text style={[styles.label, styles.labelSpaced]}>GENDER</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((option) => {
              const active = gender === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.genderPill, active && styles.genderPillActive]}
                  activeOpacity={0.8}
                  onPress={() => setGender(option.value)}
                >
                  <Text style={[styles.genderText, active && styles.genderTextActive]}>
                    {option.symbol} {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + SIZES.xl }]}>
          <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={finish}>
            <Text style={styles.buttonText}>
              {name.trim() ? `Continue as ${name.trim()}` : 'Start Listening'}
            </Text>
            <View style={styles.iconCircle}>
              <ArrowRight color="#060B18" size={20} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.lg,
  },
  header: {
    marginBottom: SIZES.xl,
  },
  kicker: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: COLORS.accent.cyan,
    marginBottom: SIZES.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#8A99AD',
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#8A99AD',
    marginBottom: SIZES.sm,
  },
  labelSpaced: {
    marginTop: SIZES.xl,
  },
  input: {
    fontFamily: FONTS.medium,
    fontSize: 17,
    color: '#FFFFFF',
    backgroundColor: 'rgba(10, 20, 42, 0.85)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  genderPill: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    borderRadius: SIZES.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    backgroundColor: 'rgba(10, 20, 42, 0.7)',
  },
  genderPillActive: {
    backgroundColor: COLORS.accent.cyan,
    borderColor: COLORS.accent.cyan,
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  genderText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#8A99AD',
  },
  genderTextActive: {
    color: '#060B18',
    fontWeight: '700',
  },
  footer: {
    paddingTop: SIZES.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 20, 42, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 212, 255, 0.35)',
    borderRadius: 31,
    paddingVertical: SIZES.sm,
    paddingLeft: SIZES.lg,
    paddingRight: SIZES.sm,
    height: 60,
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent.cyan,
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});
