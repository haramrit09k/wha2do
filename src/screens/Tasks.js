import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../components/Header';
import Fab from '../components/Fab';
import Sheet from '../components/Sheet';
import Input from '../components/Input';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { subscribeTasks, addTask, setTaskDone, removeTask } from '../api';
import { toast } from '../toast';
import { useUser } from '../auth';
import { colors, radius, shadow, type } from '../theme';

export const formatTime = date =>
  `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;

// The native Android picker also calls onChange when it is cancelled, passing the
// current date as the second argument. Only a confirmed pick ('set') counts.
export const timeFromPick = (event, picked) =>
  event && event.type === 'set' && picked ? formatTime(picked) : null;

export default function Tasks({ route, navigation }) {
  const user = useUser();
  const { listId, listName } = route.params;
  const [tasks, setTasks] = useState(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [time, setTime] = useState(null);
  const [picking, setPicking] = useState(false);

  useEffect(
    () => subscribeTasks(user.uid, listId, setTasks),
    [user.uid, listId],
  );

  // Open tasks first, finished ones sink to the bottom.
  const sorted = useMemo(
    () => (tasks || []).slice().sort((a, b) => Number(a.done) - Number(b.done)),
    [tasks],
  );
  const doneCount = (tasks || []).filter(t => t.done).length;

  const create = async () => {
    if (name.trim().length < 2) {
      toast('Please add a task name');
      return;
    }
    Keyboard.dismiss();
    await addTask(user.uid, listId, { name: name.trim(), time });
    setName('');
    setTime(null);
    setAdding(false);
    toast('Task added');
  };

  const onPick = (event, picked) => {
    setPicking(false);
    const picked24 = timeFromPick(event, picked);
    if (picked24) {
      setTime(picked24);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <Header
        title={listName}
        subtitle={tasks ? `${doneCount} of ${tasks.length} done` : ' '}
        onBack={navigation.goBack}
      />
      {tasks && tasks.length > 0 ? (
        <View style={styles.progress}>
          <View
            style={[
              styles.progressFill,
              { width: `${(doneCount / tasks.length) * 100}%` },
            ]}
          />
        </View>
      ) : null}
      <FlatList
        data={sorted}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.body}
        ListEmptyComponent={
          tasks ? (
            <EmptyState
              icon="check-all"
              title="Nothing to do"
              hint="Tap + to add your first task."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.done }}
              onPress={() => setTaskDone(user.uid, listId, item.id, !item.done)}
              style={[styles.check, item.done && styles.checkDone]}
            >
              {item.done ? <Icon name="check" size={18} color="#fff" /> : null}
            </TouchableOpacity>
            <View style={styles.cardText}>
              <Text
                style={[styles.taskName, item.done && styles.taskDone]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              {item.time ? (
                <View style={styles.timeRow}>
                  <Icon name="clock-outline" size={14} color={colors.muted} />
                  <Text style={[type.caption, styles.timeText]}>
                    Start by {item.time}
                  </Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity
              accessibilityLabel="Delete task"
              onPress={() => removeTask(user.uid, listId, item.id)}
              style={styles.trash}
            >
              <Icon name="trash-can-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      />
      <Fab label="New task" onPress={() => setAdding(true)} />

      <Sheet visible={adding} title="New task" onClose={() => setAdding(false)}>
        <Input
          icon="checkbox-marked-circle-outline"
          placeholder="What needs doing?"
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="sentences"
        />
        <TouchableOpacity
          style={styles.timeBtn}
          onPress={() => setPicking(true)}
        >
          <Icon name="clock-outline" size={20} color={colors.primary} />
          <Text style={styles.timeBtnText}>
            {time ? `Start by ${time}` : 'Pick a start time (optional)'}
          </Text>
        </TouchableOpacity>
        {picking ? (
          <DateTimePicker
            value={new Date()}
            mode="time"
            is24Hour
            display="default"
            onChange={onPick}
          />
        ) : null}
        <Button title="Add task" onPress={create} style={styles.sheetBtn} />
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  progress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: { height: 8, backgroundColor: colors.success },
  body: { paddingHorizontal: 20, paddingBottom: 110 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    ...shadow,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  cardText: { flex: 1, marginHorizontal: 14 },
  taskName: { fontSize: 17, fontWeight: '600', color: colors.ink },
  taskDone: { textDecorationLine: 'line-through', color: colors.muted },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeText: { marginLeft: 4 },
  trash: { padding: 6 },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  timeBtnText: { marginLeft: 8, color: colors.primary, fontWeight: '600' },
  sheetBtn: { marginTop: 16 },
});
