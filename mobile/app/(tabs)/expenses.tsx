import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth-context';
import { Expense, getAllExpenses, addExpense, deleteExpense } from '@/lib/expenses';
import { parseReceiptImage } from '@/lib/api';

const CATEGORIES = ['Food', 'Transport', 'Utilities', 'Health', 'Shopping', 'Entertainment', 'Education', 'Other'];
const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍽️', Transport: '🚗', Utilities: '💡', Health: '💊',
  Shopping: '🛍️', Entertainment: '🎬', Education: '📚', Other: '📦',
};

export default function ExpensesScreen() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadExpenses = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getAllExpenses();
      setExpenses(data);
    } catch { Alert.alert('Error', 'Could not load expenses'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteExpense(id);
          setExpenses(prev => prev.filter(e => e.id !== id));
        },
      },
    ]);
  };

  const totalThisMonth = expenses
    .filter(e => {
      const now = new Date();
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.amount, 0);

  const groupedByDate: Record<string, Expense[]> = {};
  expenses.forEach(e => {
    if (!groupedByDate[e.date]) groupedByDate[e.date] = [];
    groupedByDate[e.date].push(e);
  });
  const dateGroups = Object.entries(groupedByDate).sort(([a], [b]) => b > a ? 1 : -1);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🧾 Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>This Month</Text>
        <Text style={styles.summaryAmount}>₹{totalThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        <Text style={styles.summaryCount}>{expenses.length} total expenses</Text>
      </View>

      <FlatList
        data={dateGroups}
        keyExtractor={([date]) => date}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyText}>Start tracking your spending or scan a receipt</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.emptyBtnText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: [date, items] }) => (
          <View style={styles.dateGroup}>
            <Text style={styles.dateLabel}>{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            {items.map(expense => (
              <TouchableOpacity
                key={expense.id}
                style={styles.expenseCard}
                onLongPress={() => handleDelete(expense.id)}
              >
                <Text style={styles.expenseIcon}>{CATEGORY_ICONS[expense.category] || '📦'}</Text>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>{expense.title}</Text>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                </View>
                <Text style={styles.expenseAmount}>₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />

      {showAdd && (
        <AddExpenseModal
          onClose={() => setShowAdd(false)}
          onAdded={(e) => { setExpenses(prev => [e, ...prev]); setShowAdd(false); }}
        />
      )}
    </SafeAreaView>
  );
}

function AddExpenseModal({ onClose, onAdded }: { onClose: () => void; onAdded: (e: Expense) => void }) {
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !amount.trim()) { Alert.alert('Error', 'Please fill title and amount'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }
    setLoading(true);
    try {
      const id = await addExpense({ title: title.trim(), amount: amt, category, date, notes: notes.trim() || undefined });
      onAdded({ id, title: title.trim(), amount: amt, category, date, notes: notes.trim() || undefined, createdAt: null });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save expense');
    } finally { setLoading(false); }
  };

  const handleScan = async () => {
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    if (result.canceled || !result.assets[0].base64) return;
    setLoading(true);
    try {
      const parsed = await parseReceiptImage(result.assets[0].base64);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.amount) setAmount(String(parsed.amount));
      if (parsed.category) setCategory(parsed.category);
      setMode('manual');
    } catch (err: any) {
      Alert.alert('Scan Error', err.message || 'Could not parse receipt');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>Add Expense</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#4F46E5" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.modeTabs}>
          <TouchableOpacity style={[styles.modeTab, mode === 'manual' && styles.modeTabActive]} onPress={() => setMode('manual')}>
            <Text style={[styles.modeTabText, mode === 'manual' && styles.modeTabTextActive]}>✏️ Manual</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeTab, mode === 'scan' && styles.modeTabActive]} onPress={handleScan}>
            <Text style={[styles.modeTabText, mode === 'scan' && styles.modeTabTextActive]}>📷 Scan Receipt</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput style={styles.fieldInput} placeholder="What did you spend on?" placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Amount (₹) *</Text>
            <TextInput style={styles.fieldInput} placeholder="0.00" placeholderTextColor="#9CA3AF" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.categoryChip, category === c && styles.categoryChipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={styles.categoryChipText}>{CATEGORY_ICONS[c]} {c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput style={styles.fieldInput} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" value={date} onChangeText={setDate} />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput style={[styles.fieldInput, { minHeight: 80, textAlignVertical: 'top' }]} placeholder="Any notes..." placeholderTextColor="#9CA3AF" value={notes} onChangeText={setNotes} multiline />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  addBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  summaryCard: { margin: 16, backgroundColor: '#4F46E5', borderRadius: 20, padding: 24, alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 },
  summaryAmount: { color: '#fff', fontSize: 36, fontWeight: '800' },
  summaryCount: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  dateGroup: { marginBottom: 16 },
  dateLabel: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  expenseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  expenseIcon: { fontSize: 28 },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  expenseCategory: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: '#111827' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 24 },
  emptyBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  cancelText: { color: '#6B7280', fontSize: 16 },
  saveText: { color: '#4F46E5', fontSize: 16, fontWeight: '700' },
  modeTabs: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#F9FAFB' },
  modeTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: '#E5E7EB' },
  modeTabActive: { backgroundColor: '#4F46E5' },
  modeTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  modeTabTextActive: { color: '#fff' },
  modalContent: { flex: 1, padding: 20 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  fieldInput: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  categoryRow: { flexDirection: 'row', gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: 'transparent' },
  categoryChipActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
});
