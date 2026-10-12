import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Keyboard,
  ScrollView,
} from 'react-native';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import Sheet from '../components/Sheet';
import Logo from '../components/Logo';
import {signIn, resetPassword, authErrorMessage} from '../api';
import {toast} from '../toast';
import {colors, type} from '../theme';

const EMAIL = /^\S+@\S+\.\S+$/;

export default function Login({navigation}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const submit = async () => {
    Keyboard.dismiss();
    if (!EMAIL.test(email) || !password) {
      toast('Enter your email and password');
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      // The navigator swaps to the signed-in stack by itself.
    } catch (e) {
      toast(authErrorMessage(e));
      setBusy(false);
    }
  };

  const sendReset = async () => {
    if (!EMAIL.test(resetEmail)) {
      toast('Enter a valid email address');
      return;
    }
    Keyboard.dismiss();
    try {
      await resetPassword(resetEmail.trim());
      toast('Reset link sent. Check your inbox.');
      setForgot(false);
    } catch (e) {
      toast(authErrorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <Header
        title="Welcome back"
        subtitle="Log in to continue"
        onBack={navigation.goBack}
      />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Logo size={72} />
        </View>
        <Input
          icon="email-outline"
          placeholder="Email address"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          icon="lock-outline"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.gap}
        />
        <Text
          style={styles.forgot}
          onPress={() => {
            setResetEmail(email);
            setForgot(true);
          }}>
          Forgot password?
        </Text>
        <Button
          title="Log in"
          onPress={submit}
          loading={busy}
          style={styles.gap}
        />
        <Text
          style={styles.switch}
          onPress={() => navigation.replace('SignUp')}>
          New here? <Text style={styles.switchBold}>Create an account</Text>
        </Text>
      </ScrollView>

      <Sheet
        visible={forgot}
        title="Reset your password"
        onClose={() => setForgot(false)}>
        <Text style={[type.caption, styles.hint]}>
          We'll email you a link to choose a new password.
        </Text>
        <Input
          icon="email-outline"
          placeholder="Registered email"
          keyboardType="email-address"
          value={resetEmail}
          onChangeText={setResetEmail}
        />
        <Button
          title="Send reset link"
          onPress={sendReset}
          style={styles.gap}
        />
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  body: {paddingHorizontal: 24, paddingBottom: 32},
  logo: {alignItems: 'center', marginVertical: 24},
  gap: {marginTop: 14},
  hint: {marginBottom: 12},
  forgot: {
    alignSelf: 'flex-end',
    marginTop: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  switch: {marginTop: 24, textAlign: 'center', color: colors.muted},
  switchBold: {color: colors.primary, fontWeight: '700'},
});
