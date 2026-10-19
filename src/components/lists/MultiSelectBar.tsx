import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { X, ListPlus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

interface MultiSelectHeaderProps {
  selectedCount: number;
  onClose: () => void;
  onSelectAll?: () => void;
  onClear?: () => void;
  isAllSelected?: boolean;
}

export const MultiSelectHeader: React.FC<MultiSelectHeaderProps> = ({
  selectedCount,
  onClose,
  onSelectAll,
  onClear,
  isAllSelected = false,
}) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X color="#FFFFFF" size={22} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{selectedCount} selected</Text>
      <TouchableOpacity
        onPress={isAllSelected ? onClear : onSelectAll}
        style={styles.toggleBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.toggleBtnText}>{isAllSelected ? 'Clear' : 'Select all'}</Text>
      </TouchableOpacity>
    </View>
  );
};

interface MultiSelectBottomBarProps {
  selectedCount: number;
  onAddToQueue: () => void;
  bottomOffset?: number;
}

export const MultiSelectBottomBar: React.FC<MultiSelectBottomBarProps> = ({
  selectedCount,
  onAddToQueue,
  bottomOffset,
}) => {
  const insets = useSafeAreaInsets();
  const bottom = bottomOffset ?? Math.max(16, insets.bottom + 12);

  if (selectedCount === 0) return null;

  return (
    <View style={[styles.bottomBarWrapper, { bottom }]}>
      <View style={styles.bottomBarContainer}>
        <TouchableOpacity
          style={styles.queueMainBtn}
          activeOpacity={0.85}
          onPress={onAddToQueue}
        >
          <ListPlus color="#000000" size={18} strokeWidth={2.5} style={{ marginRight: 8 }} />
          <Text style={styles.queueBtnText}>Add to Queue ({selectedCount})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    color: '#FCFCFC',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleBtn: {
    padding: 6,
  },
  toggleBtnText: {
    color: COLORS.activeWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBarWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  bottomBarContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111110',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  queueMainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCFCFC',
    height: 44,
    borderRadius: 22,
  },
  queueBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
});
