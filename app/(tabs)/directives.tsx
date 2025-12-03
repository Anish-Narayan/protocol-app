// apps/(tabs)/directives.tsx

import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AlertCircle, Bell, BellOff, Check, Cpu, Plus, Pyramid, Repeat, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { auth, db } from '@/firebaseConfig';
import { useTheme } from '../../context/ThemeContext';

// --- Notification Handler ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const FONT_MONO = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

/* -----------------------------------------------------------
   Decorators + UI components
----------------------------------------------------------- */

const Corner = ({ position, color }: any) => {
  const style: any = { position: 'absolute', width: 6, height: 6, borderColor: color };
  if (position === 'TL') { style.top = -1; style.left = -1; style.borderLeftWidth = 2; style.borderTopWidth = 2; }
  if (position === 'BL') { style.bottom = -1; style.left = -1; style.borderLeftWidth = 2; style.borderBottomWidth = 2; }
  if (position === 'TR') { style.top = -1; style.right = -1; style.borderRightWidth = 2; style.borderTopWidth = 2; }
  if (position === 'BR') { style.bottom = -1; style.right = -1; style.borderRightWidth = 2; style.borderBottomWidth = 2; }
  return <View style={style} />;
};

const TaskCreator = ({ colors, onAdd, themeName, onDateSelect }: any) => {
  const [text, setText] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [interval, setInterval] = useState('');

  const handleAdd = () => {
    if (!text.trim()) return;
    const intervalMinutes = interval ? parseInt(interval) : 0;
    onAdd(text, date, intervalMinutes);
    setText('');
    setInterval('');
    setDate(null);
  };

  const onDateChange = (event: any, picked?: Date) => {
    setShowPicker(false);
    if (!picked) return;

    const now = new Date();
    const corrected = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      picked.getHours(),
      picked.getMinutes(),
      0
    );

    if (corrected.getTime() < now.getTime()) {
      corrected.setDate(corrected.getDate() + 1);
    }

    setDate(corrected);
  };

  return (
    <View style={[styles.creator, { borderColor: colors.primaryDim, backgroundColor: colors.surface }]}>
      <View style={{ flex: 1 }}>
        <TextInput
          style={[styles.input, { color: colors.text, fontFamily: FONT_MONO }]}
          placeholder={themeName === 'scifi' ? "INPUT DIRECTIVE..." : "INSCRIBE DECREE..."}
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
        />

        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.timeBtn}>
            {!date ? (
              <BellOff size={16} color={colors.textMuted} />
            ) : (
              <View style={[styles.activeTimeBadge, { backgroundColor: colors.primaryDim }]}>
                <Text style={{ color: colors.primary, fontSize: 11, fontFamily: FONT_MONO }}>
                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Bell size={12} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>

          {date && (
            <View style={[styles.intervalContainer, { borderLeftColor: colors.border }]}>
              <Repeat size={14} color={colors.textMuted} />
              <TextInput
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={interval}
                onChangeText={setInterval}
                style={[styles.intervalInput, { color: colors.primary, borderBottomColor: colors.primaryDim }]}
              />
              <Text style={{ color: colors.textMuted, fontSize: 10, fontFamily: FONT_MONO }}>MINS</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, { borderLeftColor: colors.border }]}>
        <Plus size={20} color={colors.primary} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date || new Date()}
          mode="time"
          is24Hour={false}
          onChange={onDateChange}
        />
      )}
    </View>
  );
};

const TaskItem = ({ task, colors, onToggle, onDelete }: any) => {
  const isCompleted = task.completed;
  const isRecurring = task.interval && task.interval > 0;

  return (
    <View style={[
      styles.item,
      {
        borderColor: colors.primaryDim,
        backgroundColor: isCompleted ? 'transparent' : colors.surface,
        opacity: isCompleted ? 0.5 : 1,
        borderLeftColor: isCompleted ? colors.textMuted : colors.primary
      }
    ]}>
      {!isCompleted && <Corner position="TL" color={colors.primary} />}
      {!isCompleted && <Corner position="BL" color={colors.primary} />}

      <TouchableOpacity onPress={() => onToggle(task)} style={styles.checkArea}>
        <View style={[
          styles.checkBox,
          {
            borderColor: isCompleted ? colors.textMuted : colors.primary,
            backgroundColor: isCompleted ? colors.textMuted + '20' : 'transparent'
          }
        ]}>
          {isCompleted && <Check size={14} color={colors.textMuted} />}
        </View>
      </TouchableOpacity>

      <View style={{ flex: 1, paddingLeft: 12 }}>
        <Text style={[
          styles.itemText,
          {
            color: isCompleted ? colors.textMuted : colors.text,
            textDecorationLine: isCompleted ? 'line-through' : 'none'
          }
        ]}>
          {task.title}
        </Text>

        {task.remindAt && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
            <Bell size={12} color={isCompleted ? colors.textMuted : colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 10, fontFamily: FONT_MONO }}>
              {new Date(task.remindAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>

            {isRecurring && (
              <>
                <View style={{ width: 1, height: 10, backgroundColor: colors.textMuted }} />
                <Repeat size={10} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 10, fontFamily: FONT_MONO }}>
                  EVERY {task.interval}m
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity onPress={() => onDelete(task)} style={{ padding: 10 }}>
        <Trash2 size={18} color={colors.danger} opacity={0.8} />
      </TouchableOpacity>
    </View>
  );
};

/* -----------------------------------------------------------
   MAIN SCREEN
----------------------------------------------------------- */

export default function DirectivesScreen() {
  const { themeName, theme, toggleTheme } = useTheme();
  const colors = theme.colors;

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelReady, setChannelReady] = useState(false);

  const user = auth.currentUser;
  const getDocRef = () => doc(db, 'users', user!.uid, 'schedules', 'adhoc');

  /* -----------------------------------------------------------
     Notification setup
  ----------------------------------------------------------- */

  useEffect(() => {
    async function configure() {
      let settings = await Notifications.getPermissionsAsync();
      if (!settings.granted) {
        const req = await Notifications.requestPermissionsAsync();
        if (!req.granted) {
          alert("Notification permissions not granted.");
          return;
        }
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('urgent-directives', {
          name: 'Urgent Directives',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
        });
      }

      setChannelReady(true);
    }

    configure();
  }, []);

  /* -----------------------------------------------------------
     Firestore Load + Save
  ----------------------------------------------------------- */

  const loadTasks = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDoc(getDocRef());
      if (snap.exists()) {
        setTasks(snap.data().list || []);
      }
    } catch (e) {
      console.error("Error loading tasks", e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const saveToDb = async (newTasks: any[]) => {
    setTasks(newTasks);
    try {
      await setDoc(getDocRef(), { list: newTasks }, { merge: true });
    } catch (e) {
      console.error("Error saving tasks", e);
    }
  };

  /* -----------------------------------------------------------
     Notification Helpers
  ----------------------------------------------------------- */

  const clearNotifications = async (task: any) => {
    if (Array.isArray(task.notificationIds)) {
      for (const id of task.notificationIds) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch (e) {
          console.log("Cancel error:", e);
        }
      }
    }
  };

  /* -----------------------------------------------------------
     Task Actions
  ----------------------------------------------------------- */

  const handleAdd = async (title: string, remindDate: Date | null, interval: number) => {
    if (!channelReady) {
      alert("Notification channel not ready yet. Try again shortly.");
      return;
    }

    let notificationIds: string[] = [];

    if (remindDate) {
      try {
        const repeats = interval > 0 ? 15 : 1;
        const now = Date.now();

        for (let i = 0; i < repeats; i++) {
          const scheduledTime = new Date(remindDate.getTime() + i * interval * 60_000);
          if (scheduledTime.getTime() <= now) continue;

          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: themeName === 'scifi' ? "DIRECTIVE PENDING" : "ROYAL DECREE",
              body: i === 0 ? title : `${title} (Reminder ${i})`,
              sound: true,
              color: colors.primary,
              vibrate: [0, 250, 250, 250],
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: scheduledTime,       // ← correct variable
              channelId: "urgent-directives",   // ← correct placement for your Expo version
            }
          });
          notificationIds.push(id);
        }
      } catch (e) {
        console.log("Notification scheduling error:", e);
      }
    }

    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      remindAt: remindDate ? remindDate.toISOString() : null,
      interval,
      completed: false,
      notificationIds
    };

    saveToDb([...tasks, newTask]);
  };

  const handleToggle = async (task: any) => {
    const nowCompleted = !task.completed;
    if (nowCompleted) await clearNotifications(task);
    const updated = tasks.map(t => t.id === task.id ? { ...t, completed: nowCompleted } : t);
    saveToDb(updated);
  };

  const handleDelete = async (task: any) => {
    await clearNotifications(task);
    const updated = tasks.filter(t => t.id !== task.id);
    saveToDb(updated);
  };

  /* -----------------------------------------------------------
     UI
  ----------------------------------------------------------- */

  if (loading)
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={themeName === 'scifi' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerSub, { color: colors.primary }]}>
            {themeName === 'scifi' ? 'TEMPORAL OPS //' : 'SCRIBES'}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ad-Hoc</Text>
        </View>

        <TouchableOpacity onPress={toggleTheme}>
          {themeName === 'scifi'
            ? <Pyramid color={colors.text} size={24} />
            : <Cpu color={colors.text} size={24} />
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TaskCreator colors={colors} onAdd={handleAdd} themeName={themeName} />

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {tasks.length === 0 && (
            <View style={{ marginTop: 60, alignItems: 'center', opacity: 0.5 }}>
              <AlertCircle size={40} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontFamily: FONT_MONO, marginTop: 10 }}>
                NO ACTIVE ORDERS
              </Text>
            </View>
          )}

          {tasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              colors={colors}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* -----------------------------------------------------------
   Styles
----------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase' },
  headerSub: { fontSize: 12, letterSpacing: 1 },
  creator: { flexDirection: 'row', borderWidth: 1, marginBottom: 20, borderRadius: 4, overflow: 'hidden' },
  input: { padding: 16, fontSize: 14, width: '100%' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingBottom: 10 },
  timeBtn: { paddingRight: 10 },
  activeTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4, borderRadius: 4 },
  intervalContainer: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 1, paddingLeft: 10, gap: 5 },
  intervalInput: { fontFamily: FONT_MONO, fontSize: 12, minWidth: 30, borderBottomWidth: 1, textAlign: 'center' },
  addBtn: { width: 50, borderLeftWidth: 1, alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, padding: 12, borderLeftWidth: 4, borderRadius: 2 },
  checkArea: { padding: 4 },
  checkBox: { width: 20, height: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
});
