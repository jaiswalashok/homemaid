import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllExpenses, addExpense, deleteExpense, getExpenseSummary } from '../lib/expenses';
import { parseReceipt } from '../lib/api';
import { Expense } from '../types';

const { width } = Dimensions.get('window');

export default function ExpensesScreen() {
  const { language } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    try { setExpenses(await getAllExpenses()); }
    catch { Alert.alert('Error', 'Failed to load expenses'); }
    finally { setLoading(false); }
  };

  const processReceipt = async (base64: string) => {
    setScanning(true);
    try {
      const receipt = await parseReceipt(base64, 'image/jpeg');
      if (receipt?.amount) {
        await addExpense({
          vendor: receipt.vendor || '', vendorFullName: receipt.vendorFullName || receipt.vendor || '',
          type: receipt.type || 'Other', amount: receipt.amount, emoji: receipt.emoji || '🧾',
          discount: receipt.discount || 0, displayDate: receipt.displayDate || '',
          date: receipt.date || new Date().toISOString().split('T')[0],
          address: receipt.address || '', paymentMethod: receipt.paymentMethod || 'Unknown',
          items: receipt.items || [], source: 'receipt',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('✅ Receipt Scanned', `$${receipt.amount} at ${receipt.vendor}`);
        await loadExpenses();
      } else { Alert.alert('Error', "Couldn't read receipt. Try a clearer photo."); }
    } catch { Alert.alert('Error', 'Failed to scan receipt'); }
    finally { setScanning(false); }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access required'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
    if (!result.canceled && result.assets[0].base64) await processReceipt(result.assets[0].base64);
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
    if (!result.canceled && result.assets[0].base64) await processReceipt(result.assets[0].base64);
  };

  const handleManualAdd = async () => {
    if (!vendor.trim() || !amount) return;
    try {
      const today = new Date();
      await addExpense({
        vendor: vendor.trim(), vendorFullName: vendor.trim(), type: 'Other', amount: parseFloat(amount),
        emoji: '', discount: 0, displayDate: today.toLocaleDateString(),
        date: today.toISOString().split('T')[0], address: '', paymentMethod: 'Cash',
        items: [{ name: vendor.trim(), price: parseFloat(amount) }], source: 'manual',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setVendor(''); setAmount(''); setShowAddForm(false);
      await loadExpenses();
    } catch { Alert.alert('Error', 'Failed to add expense'); }
  };

  const handleDelete = (id: string) => {
    Alert.alert(language === 'Hindi' ? 'हटाएं?' : 'Delete?', '', [
      { text: language === 'Hindi' ? 'रद्द' : 'Cancel', style: 'cancel' },
      { text: language === 'Hindi' ? 'हटाएं' : 'Delete', style: 'destructive', onPress: async () => {
        await deleteExpense(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); await loadExpenses();
      }},
    ]);
  };

  const summary = getExpenseSummary(expenses);

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#ea580c" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{language === 'Hindi' ? 'खर्च' : 'Expenses'}</Text>
      </View>

      {/* Summary */}
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { backgroundColor: '#fff7ed' }]}>
          <Ionicons name="wallet" size={18} color="#ea580c" />
          <Text style={s.summaryAmt}>${summary.total.toFixed(2)}</Text>
          <Text style={s.summaryLbl}>{language === 'Hindi' ? 'कुल' : 'Total'}</Text>
        </View>
        <View style={[s.summaryCard, { backgroundColor: '#eff6ff' }]}>
          <Ionicons name="receipt" size={18} color="#3b82f6" />
          <Text style={s.summaryAmt}>{summary.count}</Text>
          <Text style={s.summaryLbl}>{language === 'Hindi' ? 'लेनदेन' : 'Transactions'}</Text>
        </View>
        <View style={[s.summaryCard, { backgroundColor: '#f5f3ff' }]}>
          <Ionicons name="pie-chart" size={18} color="#7c3aed" />
          <Text style={s.summaryAmt}>{Object.keys(summary.byType).length}</Text>
          <Text style={s.summaryLbl}>{language === 'Hindi' ? 'श्रेणियाँ' : 'Categories'}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={s.actions}>
        <TouchableOpacity style={[s.scanBtn, scanning && { opacity: 0.5 }]} onPress={handleCamera} disabled={scanning}>
          {scanning ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={18} color="#fff" />}
          <Text style={s.scanBtnText}>{scanning ? (language === 'Hindi' ? 'स्कैनिंग...' : 'Scanning...') : (language === 'Hindi' ? 'फोटो लें' : 'Take Photo')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secBtn} onPress={handleGallery}>
          <Ionicons name="images" size={18} color="#ea580c" />
        </TouchableOpacity>
        <TouchableOpacity style={s.secBtn} onPress={() => setShowAddForm(true)}>
          <Ionicons name="add" size={20} color="#ea580c" />
        </TouchableOpacity>
      </View>

      {/* Expense List */}
      <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
        {expenses.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={64} color="#e5e7eb" />
            <Text style={s.emptyText}>{language === 'Hindi' ? 'कोई खर्च नहीं' : 'No expenses yet'}</Text>
          </View>
        ) : expenses.map((exp) => (
          <View key={exp.id} style={s.card}>
            <TouchableOpacity style={s.cardMain} onPress={() => setExpandedId(expandedId === exp.id ? null : exp.id)} activeOpacity={0.7}>
              <Text style={s.emoji}>{exp.emoji || '💰'}</Text>
              <View style={s.cardInfo}>
                <View style={s.cardRow}>
                  <Text style={s.cardVendor} numberOfLines={1}>{exp.vendorFullName || exp.vendor}</Text>
                  <View style={s.typeBadge}><Text style={s.typeText}>{exp.type}</Text></View>
                  {exp.source === 'receipt' && <View style={s.scanBadge}><Ionicons name="scan" size={8} color="#059669" /><Text style={s.scanBadgeText}>AI</Text></View>}
                </View>
                <View style={s.cardMeta}>
                  <Ionicons name="calendar-outline" size={11} color="#9ca3af" />
                  <Text style={s.metaText}>{exp.displayDate || exp.date}</Text>
                  <Text style={s.metaDot}>•</Text>
                  <Text style={s.metaText}>{exp.paymentMethod}</Text>
                </View>
              </View>
              <View style={s.cardRight}>
                <Text style={s.cardAmount}>${exp.amount.toFixed(2)}</Text>
                {exp.items && exp.items.length > 0 && (
                  <View style={s.itemsBadge}>
                    <Ionicons name="list" size={10} color="#ea580c" />
                    <Text style={s.itemsBadgeText}>{exp.items.length}</Text>
                    <Ionicons name={expandedId === exp.id ? 'chevron-up' : 'chevron-down'} size={10} color="#ea580c" />
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(exp.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="trash-outline" size={16} color="#d1d5db" />
              </TouchableOpacity>
            </TouchableOpacity>
            {expandedId === exp.id && exp.items && exp.items.length > 0 && (
              <View style={s.breakdown}>
                {exp.items.map((item, i) => (
                  <View key={i} style={s.breakdownItem}>
                    <Text style={s.breakdownName}>{item.name}</Text>
                    <Text style={s.breakdownPrice}>${item.price.toFixed(2)}</Text>
                  </View>
                ))}
                {(exp.discount ?? 0) > 0 && (
                  <View style={s.breakdownTotal}>
                    <Text style={s.discountText}>{language === 'Hindi' ? 'छूट' : 'Discount'}</Text>
                    <Text style={s.discountAmt}>-${(exp.discount ?? 0).toFixed(2)}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Manual Add Modal */}
      <Modal visible={showAddForm} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{language === 'Hindi' ? 'खर्च जोड़ें' : 'Add Expense'}</Text>
            <TextInput style={s.input} placeholder={language === 'Hindi' ? 'दुकान / विवरण' : 'Vendor / Description'} placeholderTextColor="#9ca3af" value={vendor} onChangeText={setVendor} />
            <TextInput style={s.input} placeholder={language === 'Hindi' ? 'राशि' : 'Amount'} placeholderTextColor="#9ca3af" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowAddForm(false); setVendor(''); setAmount(''); }}>
                <Text style={s.cancelText}>{language === 'Hindi' ? 'रद्द' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.submitBtn, (!vendor.trim() || !amount) && { opacity: 0.4 }]} onPress={handleManualAdd} disabled={!vendor.trim() || !amount}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={s.submitText}>{language === 'Hindi' ? 'जोड़ें' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf7f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  summaryAmt: { fontSize: 20, fontWeight: '700', color: '#111827' },
  summaryLbl: { fontSize: 10, color: '#6b7280', fontWeight: '500' },
  actions: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  scanBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ea580c', borderRadius: 12, paddingVertical: 13 },
  scanBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  secBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#fed7aa', justifyContent: 'center', alignItems: 'center' },
  list: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, color: '#9ca3af', marginTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  emoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardVendor: { fontSize: 14, fontWeight: '600', color: '#1f2937', maxWidth: '60%' },
  typeBadge: { backgroundColor: '#f3f4f6', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  typeText: { fontSize: 9, color: '#6b7280', fontWeight: '600' },
  scanBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#ecfdf5', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  scanBadgeText: { fontSize: 9, color: '#059669', fontWeight: '600' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  metaText: { fontSize: 11, color: '#9ca3af' },
  metaDot: { fontSize: 11, color: '#d1d5db' },
  cardRight: { alignItems: 'flex-end', marginRight: 6 },
  cardAmount: { fontSize: 15, fontWeight: '700', color: '#111827' },
  itemsBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  itemsBadgeText: { fontSize: 10, color: '#ea580c', fontWeight: '600' },
  breakdown: { borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fafafa', paddingHorizontal: 14, paddingVertical: 10 },
  breakdownItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  breakdownName: { fontSize: 13, color: '#374151' },
  breakdownPrice: { fontSize: 13, fontWeight: '600', color: '#374151' },
  breakdownTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 4 },
  discountText: { fontSize: 13, color: '#059669', fontWeight: '500' },
  discountAmt: { fontSize: 13, fontWeight: '600', color: '#059669' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1f2937', marginBottom: 12 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelText: { fontWeight: '600', color: '#6b7280', fontSize: 15 },
  submitBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: '#ea580c', alignItems: 'center', justifyContent: 'center' },
  submitText: { fontWeight: '600', color: '#fff', fontSize: 15 },
});
