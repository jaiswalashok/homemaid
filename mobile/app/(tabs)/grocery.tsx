import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import {
  GroceryItem, getAllGroceries, addGroceryItem, toggleGroceryItem,
  deleteGroceryItem, clearCheckedItems, addGroceryItemsBatch,
} from '@/lib/grocery';
import { formatGroceryList } from '@/lib/api';

export default function GroceryScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [showAI, setShowAI] = useState(false);

  const loadItems = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getAllGroceries();
      setItems(data);
    } catch { Alert.alert('Error', 'Could not load grocery list'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    try {
      const id = await addGroceryItem(newItem.trim());
      setItems(prev => [...prev, { id, name: newItem.trim(), checked: false, createdAt: null }]);
      setNewItem('');
    } catch { Alert.alert('Error', 'Could not add item'); }
  };

  const handleToggle = async (item: GroceryItem) => {
    await toggleGroceryItem(item.id, !item.checked);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i));
  };

  const handleDelete = async (id: string) => {
    await deleteGroceryItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleClearChecked = () => {
    Alert.alert('Clear Checked', 'Remove all checked items?', [
      { text: 'Cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          await clearCheckedItems();
          setItems(prev => prev.filter(i => !i.checked));
        },
      },
    ]);
  };

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  const grouped: Record<string, GroceryItem[]> = {};
  unchecked.forEach(item => {
    const cat = item.category || 'General';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

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
        <Text style={styles.title}>🛒 Grocery</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.aiBtn} onPress={() => setShowAI(true)}>
            <Text style={styles.aiBtnText}>✨ AI</Text>
          </TouchableOpacity>
          {checked.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearChecked}>
              <Text style={styles.clearBtnText}>Clear ({checked.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statsText}>{unchecked.length} remaining · {checked.length} done</Text>
      </View>

      <FlatList
        data={Object.entries(grouped)}
        keyExtractor={([cat]) => cat}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          unchecked.length === 0 && checked.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>List is empty</Text>
              <Text style={styles.emptyText}>Add items manually or use AI to parse a list</Text>
            </View>
          ) : null
        }
        renderItem={({ item: [category, catItems] }) => (
          <View style={styles.categoryGroup}>
            <Text style={styles.categoryLabel}>{category}</Text>
            {catItems.map(item => (
              <View key={item.id} style={styles.itemCard}>
                <TouchableOpacity style={styles.checkbox} onPress={() => handleToggle(item)}>
                  <Text style={styles.checkboxIcon}>{item.checked ? '✅' : '⬜'}</Text>
                </TouchableOpacity>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, item.checked && styles.itemNameDone]}>{item.name}</Text>
                  {item.quantity && <Text style={styles.itemQty}>{item.quantity}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        ListFooterComponent={
          checked.length > 0 ? (
            <View style={styles.categoryGroup}>
              <Text style={[styles.categoryLabel, { color: '#10B981' }]}>✅ Checked ({checked.length})</Text>
              {checked.map(item => (
                <View key={item.id} style={[styles.itemCard, styles.itemCardDone]}>
                  <TouchableOpacity style={styles.checkbox} onPress={() => handleToggle(item)}>
                    <Text style={styles.checkboxIcon}>✅</Text>
                  </TouchableOpacity>
                  <Text style={[styles.itemName, styles.itemNameDone]}>{item.name}</Text>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add item..."
          placeholderTextColor="#9CA3AF"
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addBtn, !newItem.trim() && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!newItem.trim()}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {showAI && (
        <AIGroceryModal
          onClose={() => setShowAI(false)}
          onAdded={(newItems) => {
            setItems(prev => [...prev, ...newItems]);
            setShowAI(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}

function AIGroceryModal({ onClose, onAdded }: { onClose: () => void; onAdded: (items: GroceryItem[]) => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const result = await formatGroceryList(text.trim());
      const parsedItems: { name: string; quantity?: string; category?: string }[] = result.items || [];
      await addGroceryItemsBatch(parsedItems);
      const withIds: GroceryItem[] = parsedItems.map((item, i) => ({
        id: `temp-${Date.now()}-${i}`,
        name: item.name,
        quantity: item.quantity,
        category: item.category || 'General',
        checked: false,
        createdAt: null,
      }));
      onAdded(withIds);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not parse grocery list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>✨ AI Grocery Parser</Text>
          <TouchableOpacity onPress={handleParse} disabled={loading || !text.trim()}>
            {loading ? <ActivityIndicator size="small" color="#4F46E5" /> : <Text style={[styles.saveText, !text.trim() && { opacity: 0.4 }]}>Parse</Text>}
          </TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          <Text style={styles.fieldLabel}>Paste your grocery list</Text>
          <TextInput
            style={[styles.fieldInput, { minHeight: 200, textAlignVertical: 'top' }]}
            placeholder={"2 kg onions\n1 litre milk\nBread\n500g chicken..."}
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
          />
          <Text style={styles.fieldHint}>AI will categorize and organize your list automatically</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  headerActions: { flexDirection: 'row', gap: 8 },
  aiBtn: { backgroundColor: '#EEF2FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  aiBtnText: { color: '#4F46E5', fontWeight: '700', fontSize: 13 },
  clearBtn: { backgroundColor: '#FEF2F2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  clearBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  stats: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  statsText: { fontSize: 13, color: '#9CA3AF' },
  list: { padding: 16, paddingBottom: 100 },
  categoryGroup: { marginBottom: 16 },
  categoryLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 10, marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  itemCardDone: { opacity: 0.5 },
  checkbox: { padding: 2 },
  checkboxIcon: { fontSize: 22 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '500', color: '#111827' },
  itemNameDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  itemQty: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { color: '#D1D5DB', fontSize: 16, fontWeight: '700' },
  inputRow: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingBottom: 24 },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#111827' },
  addBtn: { width: 48, height: 48, backgroundColor: '#4F46E5', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 28 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 24 },
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  cancelText: { color: '#6B7280', fontSize: 16 },
  saveText: { color: '#4F46E5', fontSize: 16, fontWeight: '700' },
  modalContent: { flex: 1, padding: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  fieldInput: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  fieldHint: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
});
