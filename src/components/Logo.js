import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadow } from '../theme';
import Icon from './Icon';

export default function Logo({ size = 88, showName = false }) {
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.tile,
          { width: size, height: size, borderRadius: size * 0.3 },
        ]}
      >
        <Icon name="clipboard-check-outline" size={size * 0.55} color="#fff" />
      </View>
      {showName ? <Text style={styles.name}>wha2do</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  tile: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  name: {
    marginTop: 16,
    fontSize: 38,
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.ink,
    letterSpacing: -0.5,
  },
});
