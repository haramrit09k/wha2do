import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Sheet from './Sheet';
import Button from './Button';
import { deleteAccount, signOut, authErrorMessage } from '../api';
import { toast } from '../toast';
import { colors, radius, type } from '../theme';

// Account actions: log out, and permanently delete the account and its data
// (an in-app deletion path is required by Google Play).
export default function AccountSheet({ visible, user, onClose }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setConfirming(false);
    onClose();
  };

  const logOut = async () => {
    close();
    await signOut();
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteAccount(user);
      toast('Your account has been deleted');
    } catch (e) {
      toast(authErrorMessage(e));
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <Sheet visible={visible} title="Account" onClose={close}>
      <View style={styles.who}>
        <Text style={styles.name}>{user.displayName || 'Your account'}</Text>
        {user.email ? <Text style={type.caption}>{user.email}</Text> : null}
      </View>
      {confirming ? (
        <View>
          <Text style={styles.warning}>
            This permanently deletes your account and every list and task in it.
            It cannot be undone.
          </Text>
          <Button
            title="Delete forever"
            variant="danger"
            loading={busy}
            onPress={remove}
          />
          <Button
            title="Keep my account"
            variant="ghost"
            style={styles.gap}
            onPress={() => setConfirming(false)}
          />
        </View>
      ) : (
        <View>
          <Button title="Log out" onPress={logOut} />
          <Button
            title="Delete account"
            variant="dangerGhost"
            style={styles.gap}
            onPress={() => setConfirming(true)}
          />
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  who: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 16,
  },
  name: { fontSize: 18, fontWeight: '700', color: colors.ink },
  warning: { color: colors.ink, lineHeight: 22, marginBottom: 16 },
  gap: { marginTop: 12 },
});
