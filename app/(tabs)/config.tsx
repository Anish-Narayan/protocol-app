// apps/(tabs)/config.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { db, auth } from '../../firebaseConfig';
import { Save, Upload, Plus, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext'; // Import Context

const getTodayString = () => new Date().toISOString().split('T')[0];
const timeToMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const calculateDuration = (s: string, e: string) => timeToMinutes(e) - timeToMinutes(s);

export default function ConfigScreen() {
  // Replace local state with Context
  const { themeName, theme } = useTheme();
  const colors = theme.colors;

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  // Load Base Schedule only (Theme loaded via context)
  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid, 'schedules', 'base')).then(snap => {
        if (snap.exists()) setTasks(snap.data().tasks || []);
      });
    }
  }, [user]);

  // ... (Keep handleSave, handleJSONUpload, updateTask exactly as they were) ...
  const handleSave = async (overwriteToday = false) => {
    if (!user) return;
    setLoading(true);
    const sorted = [...tasks].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    await setDoc(doc(db, 'users', user.uid, 'schedules', 'base'), { tasks: sorted, updatedAt: new Date() });

    if (overwriteToday) {
        const today = getTodayString();
        const dailyRef = doc(db, 'users', user.uid, 'schedules', 'daily');
        const dailySnap = await getDoc(dailyRef);
        const currentPenalties = dailySnap.exists() ? dailySnap.data().penalties || [] : [];
        const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
        const activeTasks = isWeekend ? [] : sorted.map(t => ({...t, completed:false, partiallyCompleted:false, remaining:0}));
        await setDoc(dailyRef, { date: today, tasks: activeTasks, penalties: currentPenalties, lastRun: today });
        Alert.alert("SYSTEM UPDATE", "Base schedule saved & today's schedule reset.");
    } else {
        Alert.alert("SYSTEM UPDATE", "Base schedule saved. Changes apply tomorrow.");
    }
    setLoading(false);
  };

  const handleJSONUpload = async () => {
    try {
        const res = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
        if (res.canceled) return;
        const fileUri = res.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        const json = JSON.parse(fileContent);
        const processed = json.map((t:any) => ({
            ...t, duration: calculateDuration(t.start, t.end)
        }));
        Alert.alert(
            "IMPORT PROTOCOL", 
            "Replace existing or Append?",
            [
                { text: "Append", onPress: () => setTasks([...tasks, ...processed]) },
                { text: "Replace", onPress: () => setTasks(processed), style: 'destructive' },
                { text: "Cancel", style: 'cancel' }
            ]
        );
    } catch (e) {
        Alert.alert("ERROR", "Invalid JSON or File Read Error");
    }
  };

  const updateTask = (idx: number, field: string, val: string) => {
    const newT = [...tasks];
    newT[idx][field] = val;
    if (field === 'start' || field === 'end') {
        if(newT[idx].start && newT[idx].end) newT[idx].duration = calculateDuration(newT[idx].start, newT[idx].end);
    }
    setTasks(newT);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 20 },
    headerTitle: { color: colors.text, fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 20 },
    card: { backgroundColor: colors.surface, padding: 15, marginBottom: 10, borderRadius: theme.roundness, borderWidth: 1, borderColor: colors.border },
    row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    input: { flex: 1, backgroundColor: colors.background, color: colors.text, padding: 8, borderWidth: 1, borderColor: colors.border, borderRadius: theme.roundness },
    btn: { padding: 15, borderRadius: theme.roundness, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 10 },
    btnPrimary: { backgroundColor: colors.primaryDim, borderWidth: 1, borderColor: colors.primary },
    btnText: { color: colors.primary, fontWeight: 'bold', textTransform: 'uppercase' },
    label: { color: colors.textMuted, fontSize: 10, marginBottom: 2, textTransform: 'uppercase' }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Configuration</Text>
      
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary, {flex:1}]} onPress={handleJSONUpload}>
            <Upload size={16} color={colors.primary} />
            <Text style={styles.btnText}>Import JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary, {flex:1}]} onPress={() => handleSave(false)}>
            <Save size={16} color={colors.primary} />
            <Text style={styles.btnText}>Save Base</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={[styles.btn, {borderColor: colors.danger, borderWidth:1}]} onPress={() => handleSave(true)}>
        <Text style={{color: colors.danger, fontWeight:'bold', fontSize:10}}>SAVE & OVERWRITE TODAY (DANGER)</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
        {tasks.map((t, i) => (
            <View key={i} style={styles.card}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
                    <View style={{flex:1}}>
                        <Text style={styles.label}>Protocol Name</Text>
                        <TextInput style={styles.input} value={t.label} onChangeText={v => updateTask(i, 'label', v)} placeholderTextColor={colors.textMuted} />
                    </View>
                    <TouchableOpacity onPress={() => setTasks(tasks.filter((_, idx) => idx !== i))} style={{marginLeft:10}}>
                        <Trash2 color={colors.danger} size={20} />
                    </TouchableOpacity>
                </View>
                <View style={styles.row}>
                    <View style={{flex:1}}>
                        <Text style={styles.label}>Start (HH:MM)</Text>
                        <TextInput style={styles.input} value={t.start} onChangeText={v => updateTask(i, 'start', v)} placeholder="00:00" placeholderTextColor={colors.textMuted} />
                    </View>
                    <View style={{flex:1}}>
                        <Text style={styles.label}>End (HH:MM)</Text>
                        <TextInput style={styles.input} value={t.end} onChangeText={v => updateTask(i, 'end', v)} placeholder="00:00" placeholderTextColor={colors.textMuted} />
                    </View>
                </View>
                <Text style={{color: colors.textMuted, textAlign:'right', fontSize:10}}>DUR: {t.duration}m</Text>
            </View>
        ))}
        <TouchableOpacity style={[styles.btn, {borderStyle:'dashed', borderWidth:1, borderColor: colors.textMuted}]} onPress={() => setTasks([...tasks, {label:'', start:'', end:'', duration:0}])}>
            <Plus color={colors.textMuted} />
            <Text style={{color:colors.textMuted}}>ADD DIRECTIVE</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading && (
        <View style={{position:'absolute', inset:0, backgroundColor:'rgba(0,0,0,0.5)', alignItems:'center', justifyContent:'center'}}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}