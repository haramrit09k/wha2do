import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  BackHandler,
  Platform,
  StyleSheet,
} from 'react-native';
import {colors, radius, type} from '../theme';

// Bottom sheet used for the "new list" / "new task" / "reset password" forms.
// Rendered inline (not via RN's <Modal>) so it behaves the same on Android and
// in the browser preview; the hardware back button closes it.
export default function Sheet({visible, title, onClose, children}) {
  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible) {
    return null;
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      pointerEvents="box-none"
      style={styles.root}>
      <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Close">
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={[type.heading, styles.title]}>{title}</Text>
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {...StyleSheet.absoluteFillObject, justifyContent: 'flex-end'},
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,24,60,0.45)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 24,
    paddingTop: 12,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.line,
    marginBottom: 16,
  },
  title: {marginBottom: 16},
});
