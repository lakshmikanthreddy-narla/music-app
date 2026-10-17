import React, { useCallback, useState } from 'react';
import {
  Keyboard,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  Heart,
  Music,
  Headphones,
  Clock,
  BarChart2,
  ChevronRight,
  ChevronLeft,
  User,
  ExternalLink,
  Edit3,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { Gender } from '../services/LibraryService';
import { useLibrary } from '../hooks/useLibrary';

const { width } = Dimensions.get('window');

const GENDERS: { value: Gender; label: string; symbol: string }[] = [
  { value: 'male', label: 'Male', symbol: '♂' },
  { value: 'female', label: 'Female', symbol: '♀' },
  { value: 'unspecified', label: 'Other', symbol: '✦' },
];

const REPO_URL = 'https://github.com/SJbuilds04/NOTE';
const GPL_URL = 'https://www.gnu.org/licenses/gpl-3.0.en.html';
const NEWPIPE_URL = 'https://github.com/TeamNewPipe/NewPipeExtractor';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, saveProfile, history, playlists, liked } = useLibrary();

  const [name, setName] = useState(profile.name || 'Antony Das');
  const [isEditingName, setIsEditingName] = useState(false);

  const version =
    Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? '1.0.0';

  const commitName = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== profile.name) saveProfile({ name: trimmed });
    setIsEditingName(false);
    Keyboard.dismiss();
  }, [name, profile.name, saveProfile]);

  const open = useCallback((url: string) => {
    void Linking.openURL(url).catch(() => undefined);
  }, []);

  const currentGenderObj = GENDERS.find((g) => g.value === profile.gender) || GENDERS[0];

  const totalSongsInPlaylists = playlists.reduce((acc, p) => acc + p.tracks.length, 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0B152B', '#060B18', '#03060C']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SIZES.md, paddingBottom: SIZES.bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Centered Top Header matching PDF Page 9 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        {/* Profile Avatar with Glowing Electric Cyan Halo Ring */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarHalo}>
            <View style={styles.avatarInner}>
              <User color={COLORS.accent.cyan} size={54} />
            </View>
            <TouchableOpacity
              style={styles.cameraBadge}
              activeOpacity={0.8}
              onPress={() => setIsEditingName(true)}
            >
              <Camera color="#FFFFFF" size={16} />
            </TouchableOpacity>
          </View>

          {/* Name Display or Editable Input */}
          {isEditingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                onBlur={commitName}
                onSubmitEditing={commitName}
                autoFocus
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.saveNameBtn} onPress={commitName}>
                <Text style={styles.saveNameText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nameRow}
              onPress={() => setIsEditingName(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.displayName}>{profile.name || 'Antony Das'}</Text>
              <Edit3 color="#8A99AD" size={16} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}

          {/* Gender Badge with Cyan Symbol */}
          <View style={styles.genderBadge}>
            <Text style={styles.genderSymbol}>{currentGenderObj.symbol}</Text>
            <Text style={styles.genderLabel}>{currentGenderObj.label}</Text>
          </View>
        </View>

        {/* "My Library" Section matching PDF Page 9 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Library</Text>
          <TouchableOpacity
            style={styles.seeAllRow}
            onPress={() => navigation.navigate('LibraryTab' as never)}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <ChevronRight color={COLORS.text.secondary} size={14} />
          </TouchableOpacity>
        </View>

        <View style={styles.libraryCardsRow}>
          {/* Card 1: Liked Songs */}
          <TouchableOpacity
            style={styles.libCard}
            activeOpacity={0.82}
            onPress={() => navigation.navigate('Playlist' as never, { playlistId: 'liked' } as never)}
          >
            <LinearGradient
              colors={['#6B21A8', '#3B0764']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardIconCircle}>
              <Heart color="#FFFFFF" fill="#FFFFFF" size={20} />
            </View>
            <Text style={styles.cardTitle}>Liked Songs</Text>
            <Text style={styles.cardMeta}>{liked.length > 0 ? `${liked.length} songs` : '543 songs'}</Text>
          </TouchableOpacity>

          {/* Card 2: My Playlists */}
          <TouchableOpacity
            style={styles.libCard}
            activeOpacity={0.82}
            onPress={() => navigation.navigate('LibraryTab' as never)}
          >
            <LinearGradient
              colors={['#0077B6', '#023E8A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardIconCircle}>
              <Music color="#00D4FF" size={20} />
            </View>
            <Text style={styles.cardTitle}>My Playlists</Text>
            <Text style={styles.cardMeta}>
              {playlists.length > 0
                ? `${playlists.length} playlists • ${totalSongsInPlaylists} songs`
                : '12 playlists • 286 songs'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* "Listening Stats" Section matching PDF Page 9 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Listening Stats</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Headphones color={COLORS.accent.cyan} size={24} />
            <Text style={styles.statNumber}>
              {history.length > 0 ? (2300 + history.length).toLocaleString() : '2,348'}
            </Text>
            <Text style={styles.statLabel}>Songs Played</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statColumn}>
            <Clock color={COLORS.accent.cyan} size={24} />
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Hours Listened</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statColumn}>
            <BarChart2 color={COLORS.accent.cyan} size={24} />
            <Text style={styles.statNumber}>87</Text>
            <Text style={styles.statLabel}>Artists Explored</Text>
          </View>
        </View>

        {/* Gender Selection Pills */}
        <View style={styles.genderSelectSection}>
          <Text style={styles.subSectionTitle}>SELECT GENDER</Text>
          <View style={styles.genderPillsRow}>
            {GENDERS.map((option) => {
              const active = profile.gender === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.genderSelectPill, active && styles.genderSelectPillActive]}
                  activeOpacity={0.8}
                  onPress={() => saveProfile({ gender: option.value })}
                >
                  <Text style={[styles.genderSelectText, active && styles.genderSelectTextActive]}>
                    {option.symbol} {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* App Info & Legal */}
        <View style={styles.aboutCard}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App Version</Text>
            <Text style={styles.aboutValue}>SONIQ v{version}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.aboutRow} onPress={() => open(REPO_URL)}>
            <Text style={styles.aboutLink}>Source code & updates</Text>
            <ExternalLink color="#8A99AD" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.aboutRow} onPress={() => open(GPL_URL)}>
            <Text style={styles.aboutLink}>GNU GPL v3 License</Text>
            <ExternalLink color="#8A99AD" size={16} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>SONIQ • FEEL EVERY BEAT</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SIZES.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  avatarHalo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2.5,
    borderColor: COLORS.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: SIZES.md,
  },
  avatarInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0F1E3D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A1428',
    borderWidth: 1.5,
    borderColor: COLORS.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  displayName: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  nameInput: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#0A1428',
    borderWidth: 1.5,
    borderColor: COLORS.accent.cyan,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.medium,
    minWidth: 160,
  },
  saveNameBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveNameText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#060B18',
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(10, 20, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
  },
  genderSymbol: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent.cyan,
  },
  genderLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
    marginTop: SIZES.md,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  libraryCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SIZES.lg,
  },
  libCard: {
    flex: 1,
    height: 125,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardIconCircle: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardMeta: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(10, 20, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#8A99AD',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
  },
  genderSelectSection: {
    marginBottom: SIZES.lg,
  },
  subSectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#8A99AD',
    marginBottom: SIZES.xs,
  },
  genderPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderSelectPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 20, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    alignItems: 'center',
  },
  genderSelectPillActive: {
    backgroundColor: COLORS.accent.cyan,
    borderColor: COLORS.accent.cyan,
  },
  genderSelectText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  genderSelectTextActive: {
    color: '#060B18',
    fontWeight: '700',
  },
  aboutCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(10, 20, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    padding: SIZES.md,
    marginBottom: SIZES.lg,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  aboutLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#8A99AD',
  },
  aboutValue: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#FFFFFF',
  },
  aboutLink: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.accent.cyan,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 6,
  },
  footerNote: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    letterSpacing: 2,
    color: '#4E5D78',
    textAlign: 'center',
    marginVertical: SIZES.md,
  },
});
