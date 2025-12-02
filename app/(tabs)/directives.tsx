// apps/(tabs)/directives.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AlertCircle, Bell, BellOff, Check, Plus, Trash2, Pyramid, Cpu } from 'lucide-react-native';

import { db, auth } from '@/firebaseConfig';
import { useTheme } from '../../context/ThemeContext'; // Import Context

// ... (Keep Notifications setup and Corner component as is) ...
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const FONT_MONO = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

const Corner = ({ position, color }: any) => {
    const style: any = { position: 'absolute', width: 6, height: 6, borderColor: color };
    if (position === 'TL') { style.top = -1; style.left = -1; style.borderLeftWidth = 2; style.borderTopWidth = 2; }
    if (position === 'BL') { style.bottom = -1; style.left = -1; style.borderLeftWidth = 2; style.borderBottomWidth = 2; }
    if (position === 'TR') { style.top = -1; style.right = -1; style.borderRightWidth = 2; style.borderTopWidth = 2; }
    if (position === 'BR') { style.bottom = -1; style.right = -1; style.borderRightWidth = 2; style.borderBottomWidth = 2; }
    return <View style={style} />;
  };

// ... (Keep TaskCreator and TaskItem, but remove extra internal logic if not needed, usually they are fine accepting props) ...
const TaskCreator = ({ colors, onAdd, themeName }: any) => {
    const [text, setText] = useState('');
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [hasTime, setHasTime] = useState(false);
  
    const handleAdd = () => {
      if (!text.trim()) return;
      onAdd(text, hasTime ? date : null);
      setText('');
      setHasTime(false);
    };
  
    const onDateChange = (event: any, selectedDate?: Date) => {
      setShowPicker(false);
      if (selectedDate) {
        setDate(selectedDate);
        setHasTime(true);
      }
    };
  
    return (
      <View style={[styles.creator, { borderColor: colors.primaryDim, backgroundColor: colors.surface }]}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { color: colors.text, fontFamily: FONT_MONO }]}
            placeholder={themeName === 'scifi' ? "INPUT DIRECTIVE..." : "INSCRIBE DECREE..."}
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.timeBtn}>
            {hasTime ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryDim, padding: 4, borderRadius: 4 }}>
                <Text style={{ color: colors.primary, fontSize: 10, fontFamily: FONT_MONO, fontWeight: 'bold' }}>
                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Bell size={14} color={colors.primary} />
              </View>
            ) : (
              <BellOff size={16} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, { borderLeftColor: colors.border }]}>
          <Plus size={20} color={colors.primary} />
        </TouchableOpacity>
  
        {showPicker && (
          <DateTimePicker value={date} mode="time" is24Hour={true} onChange={onDateChange} />
        )}
      </View>
    );
  };
  
  const TaskItem = ({ task, colors, onToggle, onDelete }: any) => {
    const isCompleted = task.completed;
  
    return (
      <View style={[styles.item, {
        borderColor: colors.primaryDim,
        backgroundColor: isCompleted ? 'transparent' : colors.surface,
        opacity: isCompleted ? 0.5 : 1,
        borderLeftColor: isCompleted ? colors.textMuted : colors.primary
      }]}>
        {!isCompleted && <Corner position="TL" color={colors.primary} />}
        {!isCompleted && <Corner position="BL" color={colors.primary} />}
  
        <TouchableOpacity onPress={() => onToggle(task)} style={styles.checkArea}>
          <View style={[styles.checkBox, { borderColor: isCompleted ? colors.textMuted : colors.primary, backgroundColor: isCompleted ? colors.textMuted + '20' : 'transparent' }]}>
            {isCompleted && <Check size={14} color={colors.textMuted} />}
          </View>
        </TouchableOpacity>
  
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={[styles.itemText, {
            color: isCompleted ? colors.textMuted : colors.text,
            textDecorationLine: isCompleted ? 'line-through' : 'none'
          }]}>
            {task.title}
          </Text>
          {task.remindAt && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
              <Bell size={12} color={isCompleted ? colors.textMuted : colors.primary} />
              <Text style={{ color: isCompleted ? colors.textMuted : colors.primary, fontSize: 10, fontFamily: FONT_MONO }}>
                {new Date(task.remindAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        </View>
  
        <TouchableOpacity onPress={() => onDelete(task)} style={{ padding: 10 }}>
          <Trash2 size={18} color={colors.danger} opacity={0.8} />
        </TouchableOpacity>
      </View>
    );
  };

export default function DirectivesScreen() {
  // Replace local state with Context
  const { themeName, theme, toggleTheme } = useTheme(); 
  const colors = theme.colors;

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  const getDocRef = () => doc(db, 'users', user!.uid, 'schedules', 'adhoc');

  const loadTasks = useCallback(async () => {
    if (!user) return;
    try {
      const snap = await getDoc(getDocRef());
      if (snap.exists()) {
        setTasks(snap.data().list || []);
      }
    } catch (e) { console.error("Error loading tasks", e); }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const saveToDb = async (newTasks: any[]) => {
    setTasks(newTasks);
    try { await setDoc(getDocRef(), { list: newTasks }, { merge: true }); }
    catch (e) { console.error("Error saving tasks", e); }
  };

  const handleAdd = async (title: string, remindDate: Date | null) => {
    let notificationId = null;
    if (remindDate) {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: themeName === 'scifi' ? "DIRECTIVE PENDING" : "ROYAL DECREE",
              body: title,
              sound: true
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: remindDate,
            }
          });
        }
      } catch (e) { console.log('Notification Error', e); }
    }

    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      remindAt: remindDate ? remindDate.toISOString() : null,
      completed: false,
      notificationId
    };

    saveToDb([...tasks, newTask]);
  };

  const handleToggle = async (task: any) => {
    const isNowCompleted = !task.completed;
    if (isNowCompleted && task.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(task.notificationId);
    }
    const updated = tasks.map(t => t.id === task.id ? { ...t, completed: isNowCompleted } : t);
    saveToDb(updated);
  };

  const handleDelete = async (task: any) => {
    if (task.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(task.notificationId);
    }
    const updated = tasks.filter(t => t.id !== task.id);
    saveToDb(updated);
  };

  if (loading) return <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={themeName === 'scifi' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerSub, { color: colors.primary }]}>{themeName === 'scifi' ? 'TEMPORAL OPS //' : 'SCRIBES'}</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ad-Hoc</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme}>
          {themeName === 'scifi' ? <Pyramid color={colors.text} size={24} /> : <Cpu color={colors.text} size={24} />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TaskCreator colors={colors} onAdd={handleAdd} themeName={themeName} />
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {tasks.length === 0 && (
            <View style={{ marginTop: 60, alignItems: 'center', opacity: 0.5 }}>
              <AlertCircle size={40} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontFamily: FONT_MONO, marginTop: 10, letterSpacing: 1 }}>NO ACTIVE ORDERS</Text>
            </View>
          )}
          {tasks.map(t => (
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

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase' },
  headerSub: { fontSize: 12, letterSpacing: 1 },
  creator: { flexDirection: 'row', borderWidth: 1, marginBottom: 20, alignItems: 'center', borderRadius: 4 },
  input: { flex: 1, padding: 16, fontSize: 14 },
  timeBtn: { padding: 10 },
  addBtn: { padding: 16, borderLeftWidth: 1 },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, padding: 12, borderLeftWidth: 4, borderRadius: 2 },
  checkArea: { padding: 4 },
  checkBox: { width: 20, height: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
});