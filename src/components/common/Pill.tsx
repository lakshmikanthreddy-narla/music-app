import React from 'react';
import { StyleSheet, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

interface PillProps {
  label: string;
  isActive?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Pill: React.FC<PillProps> = ({ label, isActive, onPress, style }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container,
        isActive ? styles.activeContainer : styles.inactiveContainer,
        style
      ]}
    >
      <Text style={[
        styles.label,
        isActive ? styles.activeLabel : styles.inactiveLabel
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radius.pill,
    marginRight: SIZES.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeContainer: {
    backgroundColor: COLORS.accent.cyan,
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  inactiveContainer: {
    backgroundColor: 'rgba(13, 27, 54, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.18)',
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    fontWeight: '600',
  },
  activeLabel: {
    color: '#060B18',
    fontWeight: '700',
  },
  inactiveLabel: {
    color: COLORS.text.secondary,
  }
});
