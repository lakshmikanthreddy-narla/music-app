import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronUp, ChevronDown, ListMusic } from 'lucide-react-native';
import { Track } from '../../core/types';
import { usePlayer } from '../../hooks/usePlayer';
import { COLORS } from '../../constants/theme';

interface QueueSheetProps {
  visible: boolean;
  onClose: () => void;
}

// 3-Bar Equalizer animation for the currently playing track
const EqualizerBar: React.FC<{ delay: number }> = ({ delay }) => {
  const anim = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    let isMounted = true;
    const runAnimation = () => {
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 16,
          duration: 350 + delay,
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 4,
          duration: 300 + delay,
          useNativeDriver: false,
        }),
      ]).start(() => {
        if (isMounted) runAnimation();
      });
    };
    runAnimation();
    return () => {
      isMounted = false;
    };
  }, [anim, delay]);

  return <Animated.View style={[styles.eqBar, { height: anim }]} />;
};

export const QueueSheet: React.FC<QueueSheetProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const {
    currentTrack,
    userQueue,
    contextUpcoming,
    queueContext,
    removeFromUserQueue,
    reorderUserQueue,
    clearUserQueue,
    playQueueItem,
    jumpTo,
  } = usePlayer();

  const totalUpcoming = userQueue.length + contextUpcoming.length;

  const handleClear = () => {
    if (userQueue.length > 5) {
      Alert.alert(
        'Clear Queue',
        `Are you sure you want to remove all ${userQueue.length} queued songs?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear All', style: 'destructive', onPress: clearUserQueue },
        ]
      );
    } else {
      clearUserQueue();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} onPress={onClose} activeOpacity={1} />

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(16, insets.bottom + 10) }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Queue</Text>
              <Text style={styles.headerSubtitle}>
                {totalUpcoming} {totalUpcoming === 1 ? 'song' : 'songs'} upcoming
              </Text>
            </View>

            <View style={styles.headerRight}>
              {userQueue.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.clearBtnText}>Clear queue</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X color="#FFFFFF" size={22} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* Section 1: Now Playing */}
            {currentTrack && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Now Playing</Text>
                <View style={styles.nowPlayingRow}>
                  <Image source={{ uri: currentTrack.albumImageUrl }} style={styles.trackThumb} />
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle} numberOfLines={1}>
                      {currentTrack.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {currentTrack.artist.name}
                    </Text>
                  </View>
                  <View style={styles.eqContainer}>
                    <EqualizerBar delay={0} />
                    <EqualizerBar delay={120} />
                    <EqualizerBar delay={240} />
                  </View>
                </View>
              </View>
            )}

            {/* Section 2: Next in Queue (User added queue) */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>
                Next in Queue {userQueue.length > 0 ? `(${userQueue.length})` : ''}
              </Text>

              {userQueue.length > 0 ? (
                userQueue.map((t, idx) => (
                  <View key={`uq-${t.id}-${idx}`} style={styles.queueItemRow}>
                    <TouchableOpacity
                      style={styles.queueItemTouch}
                      activeOpacity={0.7}
                      onPress={() => {
                        playQueueItem(idx);
                        onClose();
                      }}
                    >
                      <Image source={{ uri: t.albumImageUrl }} style={styles.trackThumb} />
                      <View style={styles.trackInfo}>
                        <Text style={styles.trackTitle} numberOfLines={1}>
                          {t.title}
                        </Text>
                        <Text style={styles.trackArtist} numberOfLines={1}>
                          {t.artist.name}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Reorder controls: move up/down */}
                    <View style={styles.reorderControls}>
                      {idx > 0 && (
                        <TouchableOpacity
                          style={styles.reorderBtn}
                          onPress={() => reorderUserQueue(idx, idx - 1)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <ChevronUp color="#8A92A0" size={18} />
                        </TouchableOpacity>
                      )}
                      {idx < userQueue.length - 1 && (
                        <TouchableOpacity
                          style={styles.reorderBtn}
                          onPress={() => reorderUserQueue(idx, idx + 1)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <ChevronDown color="#8A92A0" size={18} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Remove button */}
                    <TouchableOpacity
                      onPress={() => removeFromUserQueue(idx)}
                      style={styles.removeBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X color="#6B7C96" size={18} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyQueueBox}>
                  <ListMusic color="#4A4A4A" size={28} />
                  <Text style={styles.emptyQueueText}>
                    Your queue is empty. Add songs with Add to Queue.
                  </Text>
                </View>
              )}
            </View>

            {/* Section 3: Next from [context name] */}
            {contextUpcoming.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>
                  Next from {queueContext || 'Playlist'}
                </Text>
                {contextUpcoming.slice(0, 25).map((t, idx) => (
                  <TouchableOpacity
                    key={`ctx-${t.id}-${idx}`}
                    style={styles.queueItemRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      jumpTo(t.id);
                      onClose();
                    }}
                  >
                    <Image source={{ uri: t.albumImageUrl }} style={styles.trackThumb} />
                    <View style={styles.trackInfo}>
                      <Text style={styles.trackTitle} numberOfLines={1}>
                        {t.title}
                      </Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {t.artist.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    height: '85%',
    backgroundColor: '#0D0D0D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 0,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    color: '#FCFCFC',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#8A92A0',
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtn: {
    marginRight: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    color: '#B4B6B5',
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  scrollList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionWrap: {
    marginTop: 18,
  },
  sectionTitle: {
    color: '#8A92A0',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  nowPlayingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
    borderRadius: 12,
  },
  trackThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  trackTitle: {
    color: '#FCFCFC',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    color: '#B4B6B5',
    fontSize: 13,
  },
  eqContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 18,
    gap: 3,
    paddingRight: 6,
  },
  eqBar: {
    width: 3.5,
    borderRadius: 2,
    backgroundColor: COLORS.activeWhite,
  },
  queueItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  queueItemTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  reorderBtn: {
    padding: 4,
  },
  removeBtn: {
    padding: 6,
  },
  emptyQueueBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyQueueText: {
    color: '#6B6B6B',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
