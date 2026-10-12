import 'react-native-gesture-handler';
import React from 'react';
import {View, StatusBar, StyleSheet} from 'react-native';
import Navigation from './src/navigation';
import ToastHost from './src/components/ToastHost';
import {colors} from './src/theme';

export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <Navigation />
      <ToastHost />
    </View>
  );
}

const styles = StyleSheet.create({root: {flex: 1, backgroundColor: colors.bg}});
