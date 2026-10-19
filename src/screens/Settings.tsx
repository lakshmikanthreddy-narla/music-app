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
  Modal,
  Alert,
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
  ImageIcon,
  Trash2,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { Gender } from '../services/LibraryService';
import { useLibrary } from '../hooks/useLibrary';
import { useStats } from '../hooks/useStats';

const { width } = Dimensions.get('window');

// Only Male and Female per Fix 2
const GENDERS: { value: 'male' | 'female'; label: string; symbol: string }[] = [
  { value: 'male', label: 'Male', symbol: '♂' },
  { value: 'female', label: 'Female', symbol: '♀' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, saveProfile, playlists, liked } = useLibrary();
  const { songsPlayed, todayHoursListenedFormatted, artistsExploredCount } = useStats();

  const [name, setName] = useState(profile.name || 'Antony Das');
  const [isEditingName, setIsEditingName] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);

  const commitName = useCallback(() => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== profile.name) saveProfile({ name: trimmed });
    setIsEditingName(false);
    Keyboard.dismiss();
  }, [name, profile.name, saveProfile]);

  const currentGenderObj = GENDERS.find((g) => g.value === profile.gender);
  const totalSongsInPlaylists = playlists.reduce((acc, p) => acc + p.tracks.length, 0);

  // Profile photo camera action
  const handleTakePhoto = async () => {
    setPhotoSheetVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Allow Sonic Cube to use your camera to take a profile picture.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const destUri = `${FileSystem.documentDirectory ?? ''}profile_avatar_${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: result.assets[0].uri, to: destUri });
        saveProfile({ avatarUri: destUri });
      }
    } catch {
      // Graceful error handling
    }
  };

  // Profile photo gallery action
  const handleChooseFromGallery = async () => {
    setPhotoSheetVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Allow Sonic Cube to access your photos to set your profile picture.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const destUri = `${FileSystem.documentDirectory ?? ''}profile_avatar_${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: result.assets[0].uri, to: destUri });
        saveProfile({ avatarUri: destUri });
      }
    } catch {
      // Graceful error handling
    }
  };

  const handleRemovePhoto = () => {
    setPhotoSheetVisible(false);
    saveProfile({ avatarUri: null });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SIZES.md, paddingBottom: insets.bottom + 120 },
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
              source={
                profile.avatarUri
                  ? { uri: profile.avatarUri }
                  : require('../../assets/ui/avatar_profile.jpg')
              }
              style={styles.avatarInner}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.cameraBadge}
              activeOpacity={0.8}
              onPress={() => setPhotoSheetVisible(true)}
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

          {/* Gender line on Edit Profile: #D9DAD9 15 (if other, neither is shown) */}
          {currentGenderObj && (
            <Text style={styles.genderLine}>
              {currentGenderObj.symbol} {currentGenderObj.label}
            </Text>
          )}
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
            {/* Tile 1: Liked Songs (live real count) */}
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
                {liked.length} {liked.length === 1 ? 'song' : 'songs'}
              </Text>
            </TouchableOpacity>

            {/* Tile 2: My Playlists (live real count) */}
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
                {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'} • {totalSongsInPlaylists} {totalSongsInPlaylists === 1 ? 'song' : 'songs'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* "Listening Stats" Card matching Reference Screen 10 (LIVE REAL STATS) */}
        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSectionTitle}>Listening Stats</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              <Headphones color="#FFFFFF" size={26} strokeWidth={1.8} />
              <Text style={styles.statNumber}>
                {songsPlayed.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Songs Played</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statColumn}>
              <Clock color="#FFFFFF" size={26} strokeWidth={1.8} />
              <Text style={styles.statNumber}>{todayHoursListenedFormatted}</Text>
              <Text style={styles.statLabel}>Hours Listened</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statColumn}>
              <BarChart2 color="#FFFFFF" size={26} strokeWidth={1.8} />
              <Text style={styles.statNumber}>
                {artistsExploredCount.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Artists Explored</Text>
            </View>
          </View>
        </View>

        {/* Gender Selection Section - Only Male & Female sharing equal width */}
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
      </ScrollView>

      {/* Action Sheet Modal for Profile Photo */}
      <Modal
        visible={photoSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPhotoSheetVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Profile Photo</Text>

            <TouchableOpacity
              style={styles.sheetOption}
              activeOpacity={0.7}
              onPress={handleTakePhoto}
            >
              <View style={styles.sheetOptionIconWrapper}>
                <Camera color="#FFFFFF" size={20} />
              </View>
              <Text style={styles.sheetOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              activeOpacity={0.7}
              onPress={handleChooseFromGallery}
            >
              <View style={styles.sheetOptionIconWrapper}>
                <ImageIcon color="#FFFFFF" size={20} />
              </View>
              <Text style={styles.sheetOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {Boolean(profile.avatarUri) && (
              <TouchableOpacity
                style={styles.sheetOption}
                activeOpacity={0.7}
                onPress={handleRemovePhoto}
              >
                <View style={[styles.sheetOptionIconWrapper, styles.dangerIconWrapper]}>
                  <Trash2 color="#FF4444" size={20} />
                </View>
                <Text style={[styles.sheetOptionText, styles.dangerOptionText]}>Remove Photo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.sheetCancelButton}
              activeOpacity={0.8}
              onPress={() => setPhotoSheetVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: '#111110',
  },
  avatarInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#1B1B1B',
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
    marginBottom: 20,
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
    gap: 12,
  },
  genderSelectPill: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 24,
    backgroundColor: '#1B1B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderSelectPillActive: {
    backgroundColor: '#FCFCFC',
  },
  genderSelectText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#B4B6B5',
    fontWeight: '600',
  },
  genderSelectTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111110',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  sheetOptionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1B1B1B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  dangerIconWrapper: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
  },
  sheetOptionText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: '#FFFFFF',
  },
  dangerOptionText: {
    color: '#FF4444',
  },
  sheetCancelButton: {
    marginTop: 18,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1B1B1B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCancelText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#B4B6B5',
  },
});
