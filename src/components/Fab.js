import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import {colors, shadow} from '../theme';
import Icon from './Icon';

export default function Fab({icon = 'plus', onPress, label, style}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.fab, style]}>
      <Icon name={icon} size={28} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
});
