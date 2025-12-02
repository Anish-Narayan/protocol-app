// apps/(tabs)/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, AppState, ActivityIndicator } from 'react-native';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

import { db, auth } from '../../firebaseConfig';
import { ShieldAlert, Cpu, Check, Sun, LogOut, Pyramid } from 'lucide-react-native';
import NumberInputModal from '../../components/NumberInputModal';
import { useTheme } from '../../context/ThemeContext'; // Import Context

// Utils
const getTodayString = () => new Date().toISOString().split('T')[0];
const sortPenalties = (p: any[]) => [...p].sort((a, b) => b.duration - a.duration);

export default function HomeScreen() {
  // Replace local state with Context
  const { themeName, theme, toggleTheme } = useTheme(); 
  const colors = theme.colors;

  const [dailyData, setDailyData] = useState({ tasks: [], penalties: [], date: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'partial' | 'reduce' | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const user = auth.currentUser;

  // No loadTheme logic here anymore. It's in the Context.

  const loadData = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    const today = getTodayString();

    try {
      const dailyRef = doc(db, 'users', user.uid, 'schedules', 'daily');
      const dailySnap = await getDoc(dailyRef);

      if (!dailySnap.exists()) {
        await performRollover(today, []);
      } else {
        const data = dailySnap.data() as any;
        if (data.date !== today) {
          await performRollover(today, data);
        } else {
          setDailyData(data);
        }
      }
    } catch (e) {
      console.error("Data Load Error:", e);
    }
    setRefreshing(false);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') loadData();
    });
    return () => sub.remove();
  }, [loadData]);

  // ... (Keep performRollover, updateDB, toggleTask, togglePenalty, Modal handlers exactly as they were) ...
  const performRollover = async (todayStr: string, previousDailyData: any) => {
    let newPenaltiesMap: any = {};
    if (previousDailyData.penalties) {
      previousDailyData.penalties.forEach((p: any) => {
        if (!p.completed) newPenaltiesMap[p.label] = (newPenaltiesMap[p.label] || 0) + p.duration;
      });
    }
    if (previousDailyData.tasks) {
      previousDailyData.tasks.forEach((t: any) => {
        if (t.completed) return;
        let penaltyTime = t.partiallyCompleted ? (t.remaining || 0) : t.duration;
        if (penaltyTime > 0) newPenaltiesMap[t.label] = (newPenaltiesMap[t.label] || 0) + penaltyTime;
      });
    }
    const mergedPenalties = Object.entries(newPenaltiesMap).map(([label, duration]) => ({
      label, duration, completed: false, id: Math.random().toString(36).substr(2, 9)
    }));

    let newTasks: any[] = [];
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (!isWeekend) {
      const baseRef = doc(db, 'users', user!.uid, 'schedules', 'base');
      const baseSnap = await getDoc(baseRef);
      if (baseSnap.exists()) {
        newTasks = baseSnap.data().tasks.map((t: any) => ({
          ...t, completed: false, partiallyCompleted: false, remaining: 0
        }));
      }
    }
    const newDaily = { date: todayStr, tasks: newTasks, penalties: sortPenalties(mergedPenalties), lastRun: todayStr };
    await setDoc(doc(db, 'users', user!.uid, 'schedules', 'daily'), newDaily);
    setDailyData(newDaily as any);
  };

  const updateDB = async (newData: any) => {
    setDailyData(newData);
    await updateDoc(doc(db, 'users', user!.uid, 'schedules', 'daily'), newData);
  };

  const toggleTask = (task: any) => {
    const updatedTasks = dailyData.tasks.map((t: any) =>
      t.label === task.label && t.start === task.start ? { ...t, completed: !t.completed } : t
    );
    updateDB({ ...dailyData, tasks: updatedTasks });
  };

  const togglePenalty = (penalty: any) => {
    const updatedPenalties = dailyData.penalties.map((p: any) =>
      p.id === penalty.id ? { ...p, completed: true } : p
    );
    updateDB({ ...dailyData, penalties: updatedPenalties });
  };

  const handleLongPressTask = (task: any) => {
    if (task.completed) return;
    setSelectedItem(task);
    setModalType('partial');
    setModalVisible(true);
  };

  const handleLongPressPenalty = (penalty: any) => {
    if (penalty.completed) return;
    setSelectedItem(penalty);
    setModalType('reduce');
    setModalVisible(true);
  };

  const onModalConfirm = (mins: number) => {
    if (modalType === 'partial') {
      const remaining = selectedItem.duration - mins;
      if (remaining <= 0) {
        toggleTask(selectedItem);
      } else {
        const updatedTasks = dailyData.tasks.map((t: any) =>
          t === selectedItem ? { ...t, completed: true, partiallyCompleted: true, remaining: 0 } : t
        );
        const newPenalty = {
          id: Math.random().toString(36).substr(2, 9),
          label: selectedItem.label,
          duration: remaining,
          completed: false
        };
        const updatedPenalties = sortPenalties([...dailyData.penalties, newPenalty]);
        updateDB({ ...dailyData, tasks: updatedTasks, penalties: updatedPenalties });
      }
    } else if (modalType === 'reduce') {
      const newDuration = selectedItem.duration - mins;
      if (newDuration <= 0) {
        togglePenalty(selectedItem);
      } else {
        const updatedPenalties = dailyData.penalties.map((p: any) =>
          p.id === selectedItem.id ? { ...p, duration: newDuration } : p
        );
        updateDB({ ...dailyData, penalties: updatedPenalties });
      }
    }
  };

  // Styles are recreated on render to capture theme changes
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 15 },
    headerTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase' },
    headerSub: { color: colors.primary, fontSize: 12, letterSpacing: 1 },
    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, marginTop: 20 },
    card: {
      backgroundColor: colors.surface, borderLeftWidth: 4, padding: 16, marginBottom: 10,
      borderRadius: theme.roundness, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
    },
    taskActive: { borderLeftColor: colors.primary, borderColor: colors.primaryDim, borderWidth: 1 },
    taskDone: { borderLeftColor: colors.textMuted, opacity: 0.4 },
    penaltyActive: { borderLeftColor: colors.danger, backgroundColor: colors.dangerDim, borderColor: colors.danger, borderWidth: 1 },
    label: { color: colors.text, fontSize: 16, fontWeight: '600' },
    subLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
    checkBtn: { width: 30, height: 30, borderWidth: 1, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderRadius: theme.roundness },
    checkBtnPenalty: { borderColor: colors.danger },
  });

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <NumberInputModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={onModalConfirm}
        title={modalType === 'partial' ? "MINUTES COMPLETED?" : "MINUTES REDEEMED?"}
        theme={theme}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>{themeName === 'scifi' ? 'PROTOCOL //' : 'DYNASTY'}</Text>
          <Text style={styles.headerTitle}>{dailyData.date}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 15 }}>
          <TouchableOpacity onPress={toggleTheme}>
            {themeName === 'scifi' ? <Pyramid color={colors.text} size={24} /> : <Cpu color={colors.text} size={24} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signOut(auth)}>
            <LogOut color={colors.danger} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}>
        {/* PENALTIES */}
        {dailyData.penalties.filter((p: any) => !p.completed).length > 0 && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <ShieldAlert color={colors.danger} size={20} />
              <Text style={[styles.sectionTitle, { color: colors.danger, marginTop: 0, marginBottom: 0 }]}>Critical Debt</Text>
            </View>
            {dailyData.penalties.map((p: any) => {
              if (p.completed) return null;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.card, styles.penaltyActive]}
                  onLongPress={() => handleLongPressPenalty(p)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.label}>{p.label}</Text>
                    <Text style={[styles.subLabel, { color: colors.danger }]}>Owe: {p.duration} mins (Hold to reduce)</Text>
                  </View>
                  <TouchableOpacity style={[styles.checkBtn, styles.checkBtnPenalty]} onPress={() => togglePenalty(p)}>
                    <ShieldAlert color={colors.danger} size={16} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* TASKS */}
        <View style={{ marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {themeName === 'scifi' ? <Cpu color={colors.primary} size={20} /> : <Sun color={colors.primary} size={20} />}
            <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 0, marginBottom: 0 }]}>Operations</Text>
          </View>

          {dailyData.tasks.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>No active directives.</Text>
          ) : (
            dailyData.tasks.map((t: any, idx) => {
              const style = t.completed ? styles.taskDone : styles.taskActive;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.card, style]}
                  onPress={() => toggleTask(t)}
                  onLongPress={() => handleLongPressTask(t)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={[styles.label, t.completed && { textDecorationLine: 'line-through' }]}>{t.label}</Text>
                    <Text style={styles.subLabel}>
                      {t.start} - {t.end} • {t.duration}m {(!t.completed) && "(Hold: Partial)"}
                    </Text>
                  </View>
                  <View style={[styles.checkBtn, t.completed && { backgroundColor: colors.primaryDim }]}>
                    {t.completed && <Check color={colors.primary} size={18} />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}