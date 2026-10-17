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
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SIZES.md, paddingBottom: SIZES.bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Centered Top Header matching Reference Screen 10 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        {/* Profile Avatar with 2pt white ring and 30pt camera badge */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarHalo}>
            <Image
              source={require('../../assets/ui/avatar_profile.jpg')}
              style={styles.avatarInner}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.cameraBadge}
              activeOpacity={0.8}
              onPress={() => setIsEditingName(true)}
            >
              <Camera color="#FFFFFF" size={15} />
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
            </TouchableOpacity>
          )}

          {/* Gender line on Edit Profile: #D9DAD9 15 */}
          <Text style={styles.genderLine}>
            {currentGenderObj.symbol} {currentGenderObj.label}
          </Text>
        </View>

        {/* "My Library" Card matching Reference Screen 10 */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSectionTitle}>My Library</Text>
            <TouchableOpacity
              style={styles.seeAllRow}
              onPress={() => navigation.navigate('LibraryTab' as never)}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight color={COLORS.text.meta} size={14} />
            </TouchableOpacity>
          </View>

          <View style={styles.innerTilesRow}>
            {/* Tile 1: Liked Songs */}
            <TouchableOpacity
              style={styles.innerTile}
              activeOpacity={0.82}
              onPress={() => (navigation.navigate as any)('Playlist', { playlistId: 'liked' })}
            >
              <View style={styles.tileSquareIcon}>
                <Heart color="#FFFFFF" fill="#FFFFFF" size={20} />
              </View>
              <Text style={styles.tileTitle}>Liked Songs</Text>
              <Text style={styles.tileMeta}>
                {liked.length > 0 ? `${liked.length} songs` : '543 songs'}
              </Text>
            </TouchableOpacity>

            {/* Tile 2: My Playlists */}
            <TouchableOpacity
              style={styles.innerTile}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('LibraryTab' as never)}
            >
              <View style={styles.tileSquareIcon}>
                <Music color="#FFFFFF" size={20} />
              </View>
              <Text style={styles.tileTitle}>My Playlists</Text>
              <Text style={styles.tileMeta}>
                {playlists.length > 0
                  ? `${playlists.length} playlists • ${totalSongsInPlaylists} songs`
                  : '12 playlists • 286 songs'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* "Listening Stats" Card matching Reference Screen 10 */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSectionTitle}>Listening Stats</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              <Headphones color="#FFFFFF" size={26} strokeWidth={1.8} />
              <Text style={styles.statNumber}>
                {history.length > 0 ? (2300 + history.length).toLocaleString() : '2,348'}
              </Text>
              <Text style={styles.statLabel}>Songs Played</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statColumn}>
              <Clock color="#FFFFFF" size={26} strokeWidth={1.8} />
              <Text style={styles.statNumber}>156</Text>
              <Text style={styles.statLabel}>Hours Listened</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statColumn}>
              <BarChart2 color="#FFFFFF" size={26} strokeWidth={1.8} />
              <Text style={styles.statNumber}>87</Text>
              <Text style={styles.statLabel}>Artists Explored</Text>
            </View>
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
            <Text style={styles.aboutValue}>Sonic Cube v{version}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.aboutRow} onPress={() => open(REPO_URL)}>
            <Text style={styles.aboutLink}>Source code & updates</Text>
            <ExternalLink color="#B4B6B5" size={16} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.aboutRow} onPress={() => open(GPL_URL)}>
            <Text style={styles.aboutLink}>GNU GPL v3 License</Text>
            <ExternalLink color="#B4B6B5" size={16} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>SONIC CUBE • FEEL EVERY BEAT</Text>
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
    paddingHorizontal: 20,
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
    marginBottom: 24,
  },
  avatarHalo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    fontWeight: '700',
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
    backgroundColor: '#1B1B1B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.medium,
    minWidth: 160,
  },
  saveNameBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCFCFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveNameText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  genderLine: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: '#D9DAD9',
    marginTop: 2,
  },
  profileCard: {
    backgroundColor: '#0E0E0E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#B4B6B5',
  },
  innerTilesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  innerTile: {
    flex: 1,
    backgroundColor: '#1B1B1B',
    borderRadius: 12,
    padding: 14,
  },
  tileSquareIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1F1F1F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tileMeta: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#B4B6B5',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#B4B6B5',
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  genderSelectSection: {
    marginBottom: 16,
  },
  subSectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#B4B6B5',
    marginBottom: 10,
  },
  genderPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderSelectPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#1B1B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderSelectPillActive: {
    backgroundColor: '#FCFCFC',
  },
  genderSelectText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#B4B6B5',
    fontWeight: '600',
  },
  genderSelectTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  aboutCard: {
    borderRadius: 16,
    backgroundColor: '#0E0E0E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    marginBottom: 16,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  aboutLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#B4B6B5',
  },
  aboutValue: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#FFFFFF',
  },
  aboutLink: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4,
  },
  footerNote: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    letterSpacing: 2,
    color: '#B4B6B5',
    textAlign: 'center',
    marginVertical: SIZES.md,
  },
});
