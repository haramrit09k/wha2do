import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { Text, StyleSheet, Keyboard, ScrollView } from 'react-native';
import { Formik } from 'formik';
import * as yup from 'yup';
import Header from '../components/Header';
import Input from '../components/Input';
import Button from '../components/Button';
import { signUp, authErrorMessage } from '../api';
import { toast } from '../toast';
import { colors } from '../theme';

export const signUpSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'At least 3 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Not a valid email address'),
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^\d{10}$/, 'Phone number must be 10 digits'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'At least 8 characters')
    .max(32, 'At most 32 characters'),
});

export default function SignUp({ navigation }) {
  const [busy, setBusy] = useState(false);

  const onSubmit = async values => {
    Keyboard.dismiss();
    setBusy(true);
    try {
      await signUp(values);
      toast(`Welcome, ${values.username}!`);
    } catch (e) {
      toast(authErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <Header
        title="Create account"
        subtitle="It takes under a minute"
        onBack={navigation.goBack}
      />
      <Formik
        initialValues={{ username: '', email: '', phone: '', password: '' }}
        validationSchema={signUpSchema}
        onSubmit={onSubmit}
      >
        {f => (
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <Field
              f={f}
              name="username"
              icon="account-outline"
              placeholder="Username"
            />
            <Field
              f={f}
              name="email"
              icon="email-outline"
              placeholder="Email address"
              keyboardType="email-address"
            />
            <Field
              f={f}
              name="phone"
              icon="phone-outline"
              placeholder="Phone (10 digits)"
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Field
              f={f}
              name="password"
              icon="lock-outline"
              placeholder="Password (8+ characters)"
              secureTextEntry
            />
            <Button
              title="Sign up"
              onPress={f.handleSubmit}
              loading={busy}
              style={styles.submit}
            />
            <Text
              style={styles.switch}
              onPress={() => navigation.replace('Login')}
            >
              Already have an account?{' '}
              <Text style={styles.switchBold}>Log in</Text>
            </Text>
          </ScrollView>
        )}
      </Formik>
    </SafeAreaView>
  );
}

function Field({ f, name, ...props }) {
  return (
    <Input
      style={styles.field}
      value={f.values[name]}
      onChangeText={f.handleChange(name)}
      onBlur={() => f.setFieldTouched(name)}
      error={f.touched[name] && f.errors[name]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 24, paddingBottom: 32 },
  field: { marginBottom: 14 },
  submit: { marginTop: 8 },
  switch: { marginTop: 24, textAlign: 'center', color: colors.muted },
  switchBold: { color: colors.primary, fontWeight: '700' },
});
