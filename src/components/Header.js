import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, type } from '../theme';
import Icon from './Icon';

export default function Header({ title, subtitle, onBack, right }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            accessibilityLabel="Back"
            onPress={onBack}
            style={styles.iconBtn}
          >
            <Icon name="arrow-left" size={24} color={colors.ink} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titles}>
          {subtitle ? <Text style={type.caption}>{subtitle}</Text> : null}
          <Text style={type.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  titles: { flex: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
