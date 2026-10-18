import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { colors, type } from '../theme';

export default function Welcome({ navigation }) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.hero}>
        <Logo size={104} showName />
        <Text style={[type.body, styles.tagline]}>
          Your lists, your day, one place.{'\n'}Plan it. Tick it. Done.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button title="Log in" onPress={() => navigation.navigate('Login')} />
        <Button
          title="Create an account"
          variant="ghost"
          style={styles.second}
          onPress={() => navigation.navigate('SignUp')}
        />
        <Text style={styles.link} onPress={() => navigation.navigate('About')}>
          About the team
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  tagline: {
    marginTop: 12,
    textAlign: 'center',
    color: colors.muted,
    lineHeight: 24,
  },
  actions: { paddingBottom: 28, paddingHorizontal: 28 },
  second: { marginTop: 12 },
  link: {
    marginTop: 20,
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '600',
  },
});
