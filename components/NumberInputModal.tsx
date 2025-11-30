import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function NumberInputModal({ visible, onClose, onConfirm, title, theme }: any) {
  const [value, setValue] = useState('');
  const colors = theme.colors;

  const handleConfirm = () => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      onConfirm(num);
      setValue('');
      onClose();
    }
  };

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    card: { backgroundColor: colors.surface, padding: 20, borderRadius: theme.roundness, borderWidth: 1, borderColor: colors.primary },
    title: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase' },
    input: { backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border, padding: 10, borderRadius: theme.roundness, marginBottom: 15, fontSize: 18, textAlign: 'center' },
    row: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1, padding: 15, borderRadius: theme.roundness, alignItems: 'center', borderWidth: 1 },
    btnCancel: { borderColor: colors.danger, backgroundColor: 'transparent' },
    btnConfirm: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
    txtCancel: { color: colors.danger, fontWeight: 'bold' },
    txtConfirm: { color: colors.primary, fontWeight: 'bold' }
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <TextInput 
            style={styles.input} 
            placeholder="ENTER MINUTES" 
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            autoFocus
            value={value}
            onChangeText={setValue}
          />
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose}>
              <Text style={styles.txtCancel}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={handleConfirm}>
              <Text style={styles.txtConfirm}>CONFIRM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}