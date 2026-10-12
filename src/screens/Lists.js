import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Keyboard,
} from 'react-native';
import Header from '../components/Header';
import Fab from '../components/Fab';
import Sheet from '../components/Sheet';
import Input from '../components/Input';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import {subscribeLists, addList, removeList, signOut} from '../api';
import {toast} from '../toast';
import {iconForList, accentForList} from '../listStyle';
import {colors, radius, shadow, type} from '../theme';

export default function Lists({navigation, user}) {
  const [lists, setLists] = useState(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => subscribeLists(user.uid, setLists), [user.uid]);

  const create = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast('Give your list a name');
      return;
    }
    Keyboard.dismiss();
    await addList(user.uid, trimmed);
    setName('');
    setAdding(false);
    toast('List created');
  };

  const confirmDelete = list =>
    Alert.alert(
      `Delete "${list.name}"?`,
      'All tasks in this list will be removed.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeList(user.uid, list.id),
        },
      ],
    );

  const logout = () =>
    Alert.alert('Log out?', undefined, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Log out', onPress: signOut},
    ]);

  return (
    <SafeAreaView style={styles.root}>
      <Header
        subtitle="Welcome back,"
        title={user.displayName || 'friend'}
        right={
          <TouchableOpacity
            accessibilityLabel="Log out"
            onPress={logout}
            style={styles.iconBtn}>
            <Icon name="logout" size={22} color={colors.ink} />
          </TouchableOpacity>
        }
      />
      <Text style={[type.heading, styles.section]}>Your lists</Text>
      <FlatList
        data={lists || []}
        keyExtractor={l => l.id}
        contentContainerStyle={styles.listBody}
        ListEmptyComponent={
          lists ? (
            <EmptyState
              icon="playlist-plus"
              title="No lists yet"
              hint="Tap + to create your first list, like Groceries or Gym."
            />
          ) : null
        }
        renderItem={({item}) => {
          const accent = accentForList(item.name);
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.card}
              onPress={() =>
                navigation.navigate('Tasks', {
                  listId: item.id,
                  listName: item.name,
                })
              }
              onLongPress={() => confirmDelete(item)}>
              <View style={[styles.badge, {backgroundColor: accent + '22'}]}>
                <Icon name={iconForList(item.name)} size={26} color={accent} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={type.caption}>
                  Created {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>
          );
        }}
      />
      <Fab label="New list" onPress={() => setAdding(true)} />

      <Sheet visible={adding} title="New list" onClose={() => setAdding(false)}>
        <Input
          icon="format-list-bulleted"
          placeholder="List name (e.g. Groceries)"
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="sentences"
        />
        <Button title="Create list" onPress={create} style={styles.sheetBtn} />
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  section: {paddingHorizontal: 20, marginTop: 8, marginBottom: 8},
  listBody: {paddingHorizontal: 20, paddingBottom: 110},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
    ...shadow,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {flex: 1, marginHorizontal: 14},
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtn: {marginTop: 14},
});
