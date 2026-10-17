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
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    marginRight: SIZES.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeContainer: {
    backgroundColor: COLORS.activeWhite,
  },
  inactiveContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 0,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  activeLabel: {
    color: COLORS.onWhite,
    fontWeight: '700',
  },
  inactiveLabel: {
    color: COLORS.text.secondary,
    fontWeight: '600',
  }
});
