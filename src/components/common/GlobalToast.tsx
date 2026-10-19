import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastService } from '../../services/ToastService';

export const GlobalToast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = ToastService.subscribe((msg) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage(msg);

      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      timeoutRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setMessage(null);
        });
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [opacity]);

  if (!message) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.toastWrapper,
        { bottom: Math.max(24, insets.bottom + 80) },
      ]}
    >
      <Animated.View style={[styles.toastPill, { opacity }]}>
        <Text style={styles.toastText}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastPill: {
    backgroundColor: '#111110',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: '85%',
  },
  toastText: {
    color: '#FCFCFC',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
