import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { ShieldAlert, Cpu, Pyramid } from 'lucide-react-native';

export default function AuthScreen({ themeName, toggleTheme, currentTheme }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const colors = currentTheme.colors;

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 },
    card: {
      backgroundColor: colors.surface, padding: 24, borderWidth: 1,
      borderColor: colors.primary, borderRadius: currentTheme.roundness,
    },
    title: {
      color: colors.text, fontSize: 24, fontWeight: 'bold', letterSpacing: 2,
      marginTop: 16, textAlign: 'center', textTransform: 'uppercase', marginBottom: 24
    },
    input: {
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      color: colors.text, padding: 14, marginBottom: 16, borderRadius: currentTheme.roundness,
    },
    button: {
      backgroundColor: colors.primaryDim, borderWidth: 1, borderColor: colors.primary,
      padding: 16, alignItems: 'center', marginTop: 8, borderRadius: currentTheme.roundness,
    },
    buttonText: { color: colors.primary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    switchText: { color: colors.textMuted, textAlign: 'center', marginTop: 24, fontSize: 12 },
    themeBtn: { position: 'absolute', top: 60, right: 24, padding: 10, borderWidth: 1, borderColor: colors.textMuted, borderRadius: currentTheme.roundness }
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.themeBtn} onPress={toggleTheme}>
        {themeName === 'scifi' ? <Pyramid color={colors.text} size={24} /> : <Cpu color={colors.text} size={24} />}
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={{alignItems:'center'}}>
            {themeName === 'scifi' ? <Cpu size={48} color={colors.primary} /> : <Pyramid size={48} color={colors.primary} />}
            <Text style={styles.title}>{isSignUp ? 'INITIALIZE USER' : 'SYSTEM ACCESS'}</Text>
        </View>

        {error ? (
            <View style={{flexDirection:'row', alignItems:'center', marginBottom:16, backgroundColor: colors.dangerDim, padding: 10}}>
                <ShieldAlert size={16} color={colors.danger} />
                <Text style={{color: colors.danger, marginLeft: 8, fontSize: 12}}>{error}</Text>
            </View>
        ) : null}

        <TextInput style={styles.input} placeholderTextColor={colors.textMuted} placeholder="USER ID (EMAIL)" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput style={styles.input} placeholderTextColor={colors.textMuted} placeholder="PASSCODE" secureTextEntry value={password} onChangeText={setPassword} />

        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.buttonText}>{isSignUp ? 'REGISTER' : 'LOGIN'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.switchText}>{isSignUp ? 'Have account? Login' : 'No ID? Initialize'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}