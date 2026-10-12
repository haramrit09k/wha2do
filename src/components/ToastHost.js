import React, {useEffect, useRef, useState} from 'react';
import {Animated, Text, StyleSheet} from 'react-native';
import {subscribeToast} from '../toast';
import {colors, radius} from '../theme';

export default function ToastHost() {
  const [message, setMessage] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  useEffect(
    () =>
      subscribeToast(msg => {
        clearTimeout(timer.current);
        setMessage(msg);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
        timer.current = setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }, 2600);
      }),
    [opacity],
  );

  return (
    <Animated.View pointerEvents="none" style={[styles.toast, {opacity}]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 36,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  text: {color: '#fff', fontSize: 15, textAlign: 'center'},
});
