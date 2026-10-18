import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import Header from '../components/Header';
import Icon from '../components/Icon';
import { colors, radius, shadow, type } from '../theme';

const TEAM = [
  {
    name: 'Haramrit Singh Khurana',
    photo: require('../../assets/images/profile_pic.jpg'),
    github: 'https://www.github.com/haramrit09k',
    linkedin: 'https://www.linkedin.com/in/haramrit09k',
  },
  {
    name: 'Neel Narvankar',
    photo: require('../../assets/images/neel.jpg'),
    github: 'https://www.github.com/neelnarvankar30',
    linkedin: 'https://www.linkedin.com/in/neeln65',
  },
];

export default function About({ navigation }) {
  return (
    <SafeAreaView style={styles.root}>
      <Header
        title="About us"
        subtitle="Built for SWE 632 at GMU"
        onBack={navigation.goBack}
      />
      <ScrollView contentContainerStyle={styles.body}>
        {TEAM.map(p => (
          <View key={p.name} style={styles.card}>
            <Image source={p.photo} style={styles.photo} />
            <Text style={[type.heading, styles.name]}>{p.name}</Text>
            <View style={styles.links}>
              <Link icon="github" label="GitHub" url={p.github} />
              <Link icon="linkedin" label="LinkedIn" url={p.linkedin} />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Link({ icon, label, url }) {
  return (
    <TouchableOpacity style={styles.link} onPress={() => Linking.openURL(url)}>
      <Icon name={icon} size={20} color={colors.primary} />
      <Text style={styles.linkText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 20, paddingBottom: 32 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
    ...shadow,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.line,
  },
  name: { marginTop: 12 },
  links: { flexDirection: 'row', marginTop: 12 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    marginHorizontal: 6,
  },
  linkText: { marginLeft: 6, color: colors.primary, fontWeight: '700' },
});
