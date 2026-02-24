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
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Search,
  Trash2,
  Clock,
  Users,
  ChefHat,
  X,
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { Recipe, getAllRecipes, addRecipe, deleteRecipe } from '../services/recipes';
import { parseRecipe, generateRecipeImage } from '../services/api';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { COLORS, SPACING, RADIUS } from '../config/theme';

export default function RecipesScreen() {
  const { t, language } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [recipeText, setRecipeText] = useState('');
  const [adding, setAdding] = useState(false);
  const [addingStatus, setAddingStatus] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const loadRecipes = useCallback(async () => {
    try {
      const data = await getAllRecipes();
      setRecipes(data);
    } catch (err) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const filteredRecipes = recipes.filter((r) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const en = r.en;
    const hi = r.hi;
    return (
      en?.title?.toLowerCase().includes(q) ||
      en?.cuisine?.toLowerCase().includes(q) ||
      en?.description?.toLowerCase().includes(q) ||
      hi?.title?.toLowerCase().includes(q)
    );
  });

  const handleAddRecipe = async () => {
    if (!recipeText.trim()) return;
    setAdding(true);
    try {
      setAddingStatus('Parsing recipe with AI...');
      const parsed = await parseRecipe(recipeText.trim(), language);

      let imageUrl = '';
      try {
        setAddingStatus('Generating image...');
        const imageData = await generateRecipeImage(parsed.en.title);
        if (imageData.success && imageData.imageBase64) {
          setAddingStatus('Uploading image...');
          const binary = atob(imageData.imageBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const storageRef = ref(storage, `recipes/${Date.now()}_${parsed.en.title}.png`);
          const uploadResult = await uploadBytes(storageRef, bytes);
          imageUrl = await getDownloadURL(uploadResult.ref);
        }
      } catch (imgErr) {
        console.warn('Image generation failed:', imgErr);
      }

      setAddingStatus('Saving recipe...');
      await addRecipe(parsed, imageUrl ? [imageUrl] : []);
      setRecipeText('');
      setAddModalVisible(false);
      await loadRecipes();
      Alert.alert('Success', `Recipe "${parsed.en.title}" added!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add recipe');
    } finally {
      setAdding(false);
      setAddingStatus('');
    }
  };

  const handleDelete = (recipe: Recipe) => {
    Alert.alert('Delete Recipe', `Delete "${recipe.en?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecipe(recipe.id);
            await loadRecipes();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const langContent = (recipe: Recipe) => language === 'Hindi' && recipe.hi ? recipe.hi : recipe.en;

  const renderRecipe = ({ item: recipe }: { item: Recipe }) => {
    const content = langContent(recipe);
    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => setSelectedRecipe(recipe)}
        activeOpacity={0.7}
      >
        {recipe.images?.[0] ? (
          <Image source={{ uri: recipe.images[0] }} style={styles.recipeImage} />
        ) : (
          <View style={[styles.recipeImage, styles.recipePlaceholder]}>
            <Text style={styles.recipePlaceholderText}>🍳</Text>
          </View>
        )}
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle} numberOfLines={1}>{content?.title}</Text>
          <Text style={styles.recipeDesc} numberOfLines={2}>{content?.description}</Text>
          <View style={styles.recipeMeta}>
            {content?.cuisine ? (
              <View style={styles.cuisineBadge}>
                <Text style={styles.cuisineBadgeText}>{content.cuisine}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Clock size={12} color={COLORS.gray} />
              <Text style={styles.metaText}>{content?.cookTime || '—'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={12} color={COLORS.gray} />
              <Text style={styles.metaText}>{content?.servings || '—'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(recipe)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={16} color={COLORS.gray} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('recipes')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
          <Plus size={20} color={COLORS.white} />
          <Text style={styles.addBtnText}>{t('addRecipe')}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('search')}
          placeholderTextColor={COLORS.gray}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.recipes} />
        </View>
      ) : filteredRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🍳</Text>
          <Text style={styles.emptyText}>{t('noRecipes')}</Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={() => setAddModalVisible(true)}>
            <Plus size={18} color={COLORS.white} />
            <Text style={styles.emptyAddBtnText}>{t('addRecipe')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Recipe Modal */}
      <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('addRecipe')}</Text>
            <TouchableOpacity onPress={() => { if (!adding) setAddModalVisible(false); }}>
              <X size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Describe your recipe</Text>
            <TextInput
              style={styles.recipeInput}
              value={recipeText}
              onChangeText={setRecipeText}
              placeholder={t('typeOrSpeak')}
              placeholderTextColor={COLORS.gray}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!adding}
            />
            {addingStatus ? (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={COLORS.recipes} />
                <Text style={styles.statusText}>{addingStatus}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={[styles.modalAddBtn, (adding || !recipeText.trim()) && { opacity: 0.5 }]}
              onPress={handleAddRecipe}
              disabled={adding || !recipeText.trim()}
            >
              {adding ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.modalAddBtnText}>Create Recipe with AI</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Recipe Detail Modal */}
      <Modal visible={!!selectedRecipe} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedRecipe ? langContent(selectedRecipe)?.title : ''}
            </Text>
            <TouchableOpacity onPress={() => setSelectedRecipe(null)}>
              <X size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          {selectedRecipe && (
            <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
              {selectedRecipe.images?.[0] && (
                <Image source={{ uri: selectedRecipe.images[0] }} style={styles.detailImage} />
              )}
              <Text style={styles.detailDesc}>{langContent(selectedRecipe)?.description}</Text>
              <View style={styles.detailMetaRow}>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.detailMetaLabel}>{t('prepTime')}</Text>
                  <Text style={styles.detailMetaValue}>{langContent(selectedRecipe)?.prepTime || '—'}</Text>
                </View>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.detailMetaLabel}>{t('cookTime')}</Text>
                  <Text style={styles.detailMetaValue}>{langContent(selectedRecipe)?.cookTime || '—'}</Text>
                </View>
                <View style={styles.detailMetaItem}>
                  <Text style={styles.detailMetaLabel}>{t('servings')}</Text>
                  <Text style={styles.detailMetaValue}>{langContent(selectedRecipe)?.servings || '—'}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>{t('ingredients')}</Text>
              {langContent(selectedRecipe)?.ingredients?.map((ing, idx) => (
                <View key={idx} style={styles.ingredientRow}>
                  <Text style={styles.ingredientDot}>•</Text>
                  <Text style={styles.ingredientText}>
                    {ing.quantity} {ing.unit} {ing.item}
                  </Text>
                </View>
              ))}

              <Text style={styles.sectionTitle}>{t('steps')}</Text>
              {langContent(selectedRecipe)?.steps?.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.stepNumber || idx + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepText}>{step.instruction}</Text>
                    {step.duration && <Text style={styles.stepDuration}>{step.duration}</Text>}
                  </View>
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.recipes,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    gap: 6,
  },
  addBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingLeft: 8, fontSize: 15, color: COLORS.textPrimary },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  recipeImage: { width: 90, height: 90 },
  recipePlaceholder: { backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  recipePlaceholderText: { fontSize: 32 },
  recipeInfo: { flex: 1, padding: 10 },
  recipeTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  recipeDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  recipeMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  cuisineBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cuisineBadgeText: { fontSize: 10, fontWeight: '600', color: COLORS.recipes },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: COLORS.gray },
  deleteBtn: { padding: 10, justifyContent: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray, textAlign: 'center', paddingHorizontal: 40 },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.recipes,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginTop: 16,
    gap: 6,
  },
  emptyAddBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  modalContent: { padding: SPACING.md },
  modalLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  recipeInput: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 120,
    marginBottom: 16,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  statusText: { fontSize: 14, color: COLORS.recipes },
  modalAddBtn: {
    backgroundColor: COLORS.recipes,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalAddBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  detailContent: { flex: 1, padding: SPACING.md },
  detailImage: { width: '100%', height: 200, borderRadius: RADIUS.md, marginBottom: 16 },
  detailDesc: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 16 },
  detailMetaRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  detailMetaItem: { alignItems: 'center' },
  detailMetaLabel: { fontSize: 11, color: COLORS.gray, textTransform: 'uppercase' },
  detailMetaValue: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16, marginBottom: 10 },
  ingredientRow: { flexDirection: 'row', paddingVertical: 4 },
  ingredientDot: { fontSize: 14, color: COLORS.recipes, marginRight: 8, marginTop: 1 },
  ingredientText: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  stepRow: { flexDirection: 'row', marginBottom: 12 },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.recipes,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  stepContent: { flex: 1 },
  stepText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  stepDuration: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
});
