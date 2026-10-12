import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, type} from '../theme';
import Icon from './Icon';

export default function EmptyState({icon, title, hint}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Icon name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={[type.heading, styles.title]}>{title}</Text>
      <Text style={[type.caption, styles.hint]}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32},
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {marginTop: 16},
  hint: {marginTop: 6, textAlign: 'center'},
});
