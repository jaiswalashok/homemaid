import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Trash2,
  Receipt,
  Camera,
  DollarSign,
  TrendingUp,
  Calendar,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../context/LanguageContext';
import {
  Expense,
  getAllExpenses,
  addExpense,
  deleteExpense,
  getExpenseSummary,
} from '../services/expenses';
import { parseReceiptImage } from '../services/api';
import { COLORS, SPACING, RADIUS } from '../config/theme';

const EXPENSE_TYPES = ['Grocery', 'Restaurant', 'Shopping', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer'];

export default function ExpensesScreen() {
  const { t, language } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Manual add form
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Other');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const loadExpenses = useCallback(async () => {
    try {
      const data = await getAllExpenses();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const summary = getExpenseSummary(expenses);

  const handleReceiptScan = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]?.base64) return;

      setScanning(true);
      const base64 = result.assets[0].base64;
      const mimeType = 'image/jpeg';

      try {
        const receipt = await parseReceiptImage(base64, mimeType);
        if (receipt && receipt.amount) {
          await addExpense({
            vendor: receipt.vendor || '',
            vendorFullName: receipt.vendorFullName || receipt.vendor || '',
            type: receipt.type || 'Other',
            amount: receipt.amount,
            emoji: receipt.emoji || '🧾',
            discount: receipt.discount || 0,
            displayDate: receipt.displayDate || '',
            date: receipt.date || new Date().toISOString().split('T')[0],
            address: receipt.address || '',
            paymentMethod: receipt.paymentMethod || 'Unknown',
            items: receipt.items || [],
            source: 'receipt',
          });
          Alert.alert('Success', `Receipt scanned: $${receipt.amount} at ${receipt.vendor}`);
          await loadExpenses();
        } else {
          Alert.alert('Error', "Couldn't read receipt. Try a clearer photo.");
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to scan receipt');
      }
      setScanning(false);
    } catch (err) {
      console.error('Camera error:', err);
      setScanning(false);
    }
  };

  const handleManualAdd = async () => {
    if (!vendor.trim() || !amount) return;
    try {
      const today = new Date();
      const day = today.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
      await addExpense({
        vendor: vendor.trim(),
        vendorFullName: vendor.trim(),
        type,
        amount: parseFloat(amount),
        emoji: type === 'Grocery' ? '🛒' : type === 'Restaurant' ? '🍽️' : type === 'Shopping' ? '🛍️' : '💰',
        discount: 0,
        displayDate: `${day}${suffix} ${months[today.getMonth()]}`,
        date: today.toISOString().split('T')[0],
        address: '',
        paymentMethod,
        items: [{ name: vendor.trim(), price: parseFloat(amount) }],
        source: 'manual',
      });
      Alert.alert('Success', 'Expense added!');
      setVendor('');
      setAmount('');
      setShowAddForm(false);
      await loadExpenses();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add expense');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Expense', 'Delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(id);
            await loadExpenses();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const renderExpense = ({ item: exp }: { item: Expense }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseEmoji}>
        <Text style={styles.emojiText}>{exp.emoji || '💰'}</Text>
      </View>
      <View style={styles.expenseInfo}>
        <View style={styles.expenseNameRow}>
          <Text style={styles.expenseName} numberOfLines={1}>{exp.vendorFullName || exp.vendor}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{exp.type}</Text>
          </View>
          {exp.source === 'receipt' && (
            <View style={[styles.typeBadge, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[styles.typeBadgeText, { color: COLORS.success }]}>Scanned</Text>
            </View>
          )}
        </View>
        <View style={styles.expenseMetaRow}>
          <Calendar size={11} color={COLORS.gray} />
          <Text style={styles.expenseMeta}>{exp.displayDate || exp.date}</Text>
          <Text style={styles.expenseMetaDot}>•</Text>
          <Text style={styles.expenseMeta}>{exp.paymentMethod}</Text>
        </View>
      </View>
      <View style={styles.expenseAmountCol}>
        <Text style={styles.expenseAmount}>${exp.amount?.toFixed(2)}</Text>
        {exp.items?.length > 1 && (
          <Text style={styles.expenseItemCount}>{exp.items.length} items</Text>
        )}
      </View>
      <TouchableOpacity style={styles.expenseDeleteBtn} onPress={() => handleDelete(exp.id)}>
        <Trash2 size={16} color={COLORS.gray} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('expenses')}</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardIcon}>
            <DollarSign size={16} color={COLORS.success} />
          </View>
          <Text style={styles.summaryCardLabel}>{t('total')}</Text>
          <Text style={styles.summaryCardValue}>${summary.total.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardIcon}>
            <Receipt size={16} color={COLORS.recipes} />
          </View>
          <Text style={styles.summaryCardLabel}>{t('transactions')}</Text>
          <Text style={styles.summaryCardValue}>{summary.count}</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardIcon}>
            <TrendingUp size={16} color={COLORS.expenses} />
          </View>
          <Text style={styles.summaryCardLabel}>{t('categories')}</Text>
          <Text style={styles.summaryCardValue}>{Object.keys(summary.byType).length}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.scanBtn} onPress={handleReceiptScan} disabled={scanning}>
          {scanning ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Camera size={18} color={COLORS.white} />
          )}
          <Text style={styles.scanBtnText}>{scanning ? 'Scanning...' : t('scanReceipt')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.manualBtn} onPress={() => setShowAddForm(!showAddForm)}>
          <Plus size={18} color={COLORS.textPrimary} />
          <Text style={styles.manualBtnText}>{t('addManual')}</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Add Form */}
      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.formInput}
            value={vendor}
            onChangeText={setVendor}
            placeholder="Vendor / Description"
            placeholderTextColor={COLORS.gray}
          />
          <View style={styles.formRow}>
            <TextInput
              style={[styles.formInput, { flex: 1 }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="Amount"
              placeholderTextColor={COLORS.gray}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.formRow}>
            <FlatList
              data={EXPENSE_TYPES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.chip, type === item && styles.chipActive]}
                  onPress={() => setType(item)}
                >
                  <Text style={[styles.chipText, type === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
          <View style={styles.formRow}>
            <FlatList
              data={PAYMENT_METHODS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.chip, paymentMethod === item && styles.chipActive]}
                  onPress={() => setPaymentMethod(item)}
                >
                  <Text style={[styles.chipText, paymentMethod === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
          <TouchableOpacity
            style={[styles.formAddBtn, (!vendor.trim() || !amount) && { opacity: 0.5 }]}
            onPress={handleManualAdd}
            disabled={!vendor.trim() || !amount}
          >
            <Text style={styles.formAddBtnText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Expenses List */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.expenses} />
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyText}>{t('noExpenses')}</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderExpense}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={() =>
            Object.keys(summary.byType).length > 0 ? (
              <View style={styles.categoryCard}>
                <Text style={styles.categoryTitle}>By Category</Text>
                {Object.entries(summary.byType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amt]) => (
                    <View key={cat} style={styles.categoryRow}>
                      <Text style={styles.categoryName}>{cat}</Text>
                      <View style={styles.categoryBarBg}>
                        <View style={[styles.categoryBarFill, { width: `${(amt / summary.total) * 100}%` }]} />
                      </View>
                      <Text style={styles.categoryAmount}>${amt.toFixed(2)}</Text>
                    </View>
                  ))}
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.expenses,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  summaryCardIcon: { marginBottom: 4 },
  summaryCardLabel: { fontSize: 10, color: COLORS.gray, textTransform: 'uppercase' },
  summaryCardValue: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: 8,
    marginBottom: 8,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.recipes,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  scanBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  manualBtnText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '500' },
  addForm: {
    marginHorizontal: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    gap: 8,
  },
  formInput: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  formRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.inputBackground,
    marginRight: 6,
  },
  chipActive: { backgroundColor: COLORS.expenses },
  chipText: { fontSize: 12, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  formAddBtn: {
    backgroundColor: COLORS.expenses,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  formAddBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  expenseEmoji: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  emojiText: { fontSize: 18 },
  expenseInfo: { flex: 1 },
  expenseNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  expenseName: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, maxWidth: '60%' },
  typeBadge: { backgroundColor: COLORS.inputBackground, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 9, fontWeight: '600', color: COLORS.gray },
  expenseMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  expenseMeta: { fontSize: 11, color: COLORS.gray },
  expenseMetaDot: { fontSize: 11, color: COLORS.border },
  expenseAmountCol: { alignItems: 'flex-end', marginRight: 8 },
  expenseAmount: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  expenseItemCount: { fontSize: 10, color: COLORS.gray },
  expenseDeleteBtn: { padding: 6 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  categoryTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  categoryName: { fontSize: 12, color: COLORS.gray, width: 80 },
  categoryBarBg: { flex: 1, height: 6, backgroundColor: COLORS.lightGray, borderRadius: 3, overflow: 'hidden' },
  categoryBarFill: { height: '100%', backgroundColor: COLORS.recipes, borderRadius: 3 },
  categoryAmount: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, width: 60, textAlign: 'right' },
});
