import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Trash2,
  ShoppingCart,
  Check,
  Circle,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import {
  GroceryItem,
  getAllGroceries,
  addGroceryItem,
  toggleGroceryPurchased,
  deleteGroceryItem,
  clearPurchasedGroceries,
} from '../services/grocery';
import { formatGroceryItems } from '../services/api';
import { COLORS, SPACING, RADIUS } from '../config/theme';

export default function GroceryScreen() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [adding, setAdding] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const data = await getAllGroceries();
      setItems(data);
    } catch (err) {
      console.error('Failed to load groceries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleAdd = async () => {
    if (!newItemText.trim()) return;
    setAdding(true);
    try {
      const formatted = await formatGroceryItems(newItemText.trim());
      for (const item of formatted) {
        await addGroceryItem({
          name: item,
          quantity: '',
          emoji: '',
          purchased: false,
          source: 'manual',
        });
      }
      setNewItemText('');
      await loadItems();
      Alert.alert('Success', `Added ${formatted.length} item(s)`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (item: GroceryItem) => {
    try {
      await toggleGroceryPurchased(item.id, !item.purchased);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, purchased: !i.purchased } : i
        )
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGroceryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete');
    }
  };

  const handleClearPurchased = async () => {
    Alert.alert('Clear Purchased', 'Remove all purchased items?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            const count = await clearPurchasedGroceries();
            if (count > 0) {
              await loadItems();
              Alert.alert('Success', `Cleared ${count} purchased item(s)`);
            }
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to clear');
          }
        },
      },
    ]);
  };

  const unpurchased = items.filter((i) => !i.purchased);
  const purchased = items.filter((i) => i.purchased);

  const renderUnpurchased = ({ item }: { item: GroceryItem }) => (
    <TouchableOpacity
      style={styles.groceryItem}
      onPress={() => handleToggle(item)}
      activeOpacity={0.7}
    >
      <Circle size={22} color={COLORS.grocery} />
      <Text style={styles.groceryName}>{item.name}</Text>
      {item.source === 'telegram' && (
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceBadgeText}>Telegram</Text>
        </View>
      )}
      {item.source === 'recipe' && (
        <View style={[styles.sourceBadge, { backgroundColor: '#FFF7ED' }]}>
          <Text style={[styles.sourceBadgeText, { color: COLORS.recipes }]}>Recipe</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={14} color={COLORS.gray} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderPurchased = ({ item }: { item: GroceryItem }) => (
    <TouchableOpacity
      style={[styles.groceryItem, styles.purchasedItem]}
      onPress={() => handleToggle(item)}
      activeOpacity={0.7}
    >
      <CheckCircle2 size={22} color={COLORS.grocery} />
      <Text style={[styles.groceryName, styles.purchasedName]}>{item.name}</Text>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={14} color={COLORS.gray} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('grocery')}</Text>
      </View>

      {/* Add Item Bar */}
      <View style={styles.addBar}>
        <TextInput
          style={styles.addInput}
          value={newItemText}
          onChangeText={setNewItemText}
          placeholder={t('addGroceries')}
          placeholderTextColor={COLORS.gray}
          editable={!adding}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
          disabled={adding || !newItemText.trim()}
        >
          {adding ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Plus size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {unpurchased.length} {t('remaining')} • {purchased.length} {t('purchased')}
        </Text>
        {purchased.length > 0 && (
          <TouchableOpacity onPress={handleClearPurchased} style={styles.clearBtn}>
            <XCircle size={14} color={COLORS.urgent} />
            <Text style={styles.clearBtnText}>{t('clearPurchased')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.grocery} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>{t('noGroceries')}</Text>
          <Text style={styles.emptySubtext}>Add items above</Text>
        </View>
      ) : (
        <FlatList
          data={[...unpurchased]}
          renderItem={renderUnpurchased}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={() =>
            purchased.length > 0 ? (
              <View>
                <View style={styles.purchasedHeader}>
                  <Check size={14} color={COLORS.grocery} />
                  <Text style={styles.purchasedHeaderText}>PURCHASED</Text>
                </View>
                {purchased.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.groceryItem, styles.purchasedItem]}
                    onPress={() => handleToggle(item)}
                    activeOpacity={0.7}
                  >
                    <CheckCircle2 size={22} color={COLORS.grocery} />
                    <Text style={[styles.groceryName, styles.purchasedName]}>{item.name}</Text>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={14} color={COLORS.gray} />
                    </TouchableOpacity>
                  </TouchableOpacity>
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
    backgroundColor: COLORS.grocery,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.grocery,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: 8,
  },
  statsText: { fontSize: 12, color: COLORS.gray },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearBtnText: { fontSize: 12, color: COLORS.urgent },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
  groceryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
    gap: 10,
  },
  purchasedItem: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    opacity: 0.6,
  },
  groceryName: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  purchasedName: { color: COLORS.gray, textDecorationLine: 'line-through' },
  sourceBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceBadgeText: { fontSize: 9, fontWeight: '600', color: '#3B82F6' },
  deleteBtn: { padding: 4 },
  purchasedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 8,
  },
  purchasedHeaderText: { fontSize: 11, fontWeight: '700', color: COLORS.gray, letterSpacing: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray },
  emptySubtext: { fontSize: 13, color: COLORS.border, marginTop: 4 },
});
