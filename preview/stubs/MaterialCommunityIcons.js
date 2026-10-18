/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { Text } from 'react-native';
import glyphs from '../../node_modules/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json';

// Browser stand-in for react-native-vector-icons: same glyph map + font file.
export default function Icon({ name, size = 12, color, style, ...rest }) {
  const glyph = glyphs[name] ? String.fromCodePoint(glyphs[name]) : '?';
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: 'MaterialCommunityIcons',
          fontSize: size,
          color,
          fontWeight: 'normal',
          fontStyle: 'normal',
        },
        style,
      ]}
    >
      {glyph}
    </Text>
  );
}
