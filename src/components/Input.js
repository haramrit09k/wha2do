import React from 'react';
import { View, TextInput, Text, Platform, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';
import Icon from './Icon';

export default function Input({ icon, error, style, ...props }) {
  return (
    <View style={style}>
      <View style={[styles.row, error && styles.rowError]}>
        {icon ? (
          <Icon
            name={icon}
            size={20}
            color={colors.muted}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          style={styles.input}
          placeholderTextColor="#9AA1BD"
          autoCapitalize="none"
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    height: 54,
  },
  rowError: { borderColor: colors.danger },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 0,
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 4, marginLeft: 6 },
});
