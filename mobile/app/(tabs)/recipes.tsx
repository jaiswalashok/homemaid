import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Alert, Modal, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { Recipe, getAllRecipes, addRecipe, deleteRecipe } from '@/lib/recipes';
import { parseRecipeFromText, parseRecipeFromUrl } from '@/lib/api';
import { speechToText } from '@/lib/speech';

export default function RecipesScreen() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const loadRecipes = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getAllRecipes();
      setRecipes(data);
    } catch { Alert.alert('Error', 'Could not load recipes'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Recipe', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteRecipe(id);
          setRecipes(prev => prev.filter(r => r.id !== id));
        },
      },
    ]);
  };

  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.cuisine || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Text style={styles.title}>🍳 Recipes</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="🔍  Search recipes..."
          placeholderTextColor="#9CA3AF"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={r => r.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👨‍🍳</Text>
            <Text style={styles.emptyTitle}>No recipes yet</Text>
            <Text style={styles.emptyText}>Add your first recipe or paste a URL to import</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.emptyBtnText}>Add Recipe</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelectedRecipe(item)}>
            <View style={styles.cardImagePlaceholder}>
              <Text style={styles.cardEmoji}>🍽️</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              {item.cuisine && <Text style={styles.cardCuisine}>{item.cuisine}</Text>}
              <View style={styles.cardMeta}>
                {item.prepTime && <Text style={styles.cardMetaText}>⏱ {item.prepTime}</Text>}
                {item.servings && <Text style={styles.cardMetaText}>👥 {item.servings}</Text>}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {showAdd && (
        <AddRecipeModal
          onClose={() => setShowAdd(false)}
          onAdded={(r) => { setRecipes(prev => [r, ...prev]); setShowAdd(false); }}
        />
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onDelete={() => { handleDelete(selectedRecipe.id); setSelectedRecipe(null); }}
        />
      )}
    </SafeAreaView>
  );
}

function AddRecipeModal({ onClose, onAdded }: { onClose: () => void; onAdded: (r: Recipe) => void }) {
  const [mode, setMode] = useState<'manual' | 'url' | 'text'>('manual');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      let recipeData: any;

      if (mode === 'url' && url.trim()) {
        recipeData = await parseRecipeFromUrl(url.trim());
      } else if (mode === 'text' && text.trim()) {
        recipeData = await parseRecipeFromText(text.trim());
      } else {
        if (!title.trim()) { Alert.alert('Error', 'Please enter a title'); setLoading(false); return; }
        recipeData = {
          title: title.trim(),
          ingredients: ingredients.split('\n').filter(Boolean),
          steps: steps.split('\n').filter(Boolean),
          cuisine: cuisine.trim(),
        };
      }

      const id = await addRecipe(recipeData);
      onAdded({ id, ...recipeData, createdAt: null });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>Add Recipe</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#4F46E5" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.modeTabs}>
          {(['manual', 'url', 'text'] as const).map(m => (
            <TouchableOpacity key={m} style={[styles.modeTab, mode === m && styles.modeTabActive]} onPress={() => setMode(m)}>
              <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                {m === 'manual' ? '✏️ Manual' : m === 'url' ? '🔗 URL' : '📝 Text'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          {mode === 'url' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Recipe URL</Text>
              <TextInput style={styles.fieldInput} placeholder="https://..." placeholderTextColor="#9CA3AF" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" />
              <Text style={styles.fieldHint}>Paste a recipe URL and AI will extract the details</Text>
            </View>
          )}
          {mode === 'text' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Recipe Text</Text>
              <TextInput style={[styles.fieldInput, styles.textArea]} placeholder="Paste recipe text here..." placeholderTextColor="#9CA3AF" value={text} onChangeText={setText} multiline numberOfLines={8} />
            </View>
          )}
          {mode === 'manual' && (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Title *</Text>
                <TextInput style={styles.fieldInput} placeholder="Recipe name" placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Cuisine</Text>
                <TextInput style={styles.fieldInput} placeholder="e.g. Italian, Indian" placeholderTextColor="#9CA3AF" value={cuisine} onChangeText={setCuisine} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Ingredients (one per line)</Text>
                <TextInput style={[styles.fieldInput, styles.textArea]} placeholder="2 cups flour&#10;1 tsp salt..." placeholderTextColor="#9CA3AF" value={ingredients} onChangeText={setIngredients} multiline numberOfLines={5} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Steps (one per line)</Text>
                <TextInput style={[styles.fieldInput, styles.textArea]} placeholder="Mix flour and salt...&#10;Bake at 350°F..." placeholderTextColor="#9CA3AF" value={steps} onChangeText={setSteps} multiline numberOfLines={6} />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function RecipeDetailModal({ recipe, onClose, onDelete }: { recipe: Recipe; onClose: () => void; onDelete: () => void }) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.cancelText}>← Back</Text></TouchableOpacity>
          <Text style={styles.modalTitle} numberOfLines={1}>{recipe.title}</Text>
          <TouchableOpacity onPress={onDelete}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          <View style={styles.recipeHero}>
            <Text style={styles.recipeHeroEmoji}>🍽️</Text>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <View style={styles.recipeMeta}>
              {recipe.cuisine && <Text style={styles.recipeMetaItem}>🌍 {recipe.cuisine}</Text>}
              {recipe.prepTime && <Text style={styles.recipeMetaItem}>⏱ {recipe.prepTime}</Text>}
              {recipe.cookTime && <Text style={styles.recipeMetaItem}>🔥 {recipe.cookTime}</Text>}
              {recipe.servings && <Text style={styles.recipeMetaItem}>👥 {recipe.servings}</Text>}
            </View>
          </View>

          {recipe.ingredients?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🧂 Ingredients</Text>
              {recipe.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.ingredientText}>{ing}</Text>
                </View>
              ))}
            </View>
          )}

          {recipe.steps?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👨‍🍳 Steps</Text>
              {recipe.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}
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
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  search: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#111827' },
  grid: { padding: 12, paddingBottom: 100 },
  row: { justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardImagePlaceholder: { height: 100, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 40 },
  cardBody: { padding: 12, gap: 4 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardCuisine: { fontSize: 12, color: '#6B7280' },
  cardMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cardMetaText: { fontSize: 11, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 24 },
  emptyBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  cancelText: { color: '#6B7280', fontSize: 16 },
  saveText: { color: '#4F46E5', fontSize: 16, fontWeight: '700' },
  deleteText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  modeTabs: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#F9FAFB' },
  modeTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: '#E5E7EB' },
  modeTabActive: { backgroundColor: '#4F46E5' },
  modeTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  modeTabTextActive: { color: '#fff' },
  modalContent: { flex: 1, padding: 20 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  fieldInput: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  fieldHint: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  recipeHero: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#EEF2FF', borderRadius: 16, marginBottom: 24 },
  recipeHeroEmoji: { fontSize: 64 },
  recipeTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 12, textAlign: 'center' },
  recipeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, justifyContent: 'center' },
  recipeMetaItem: { fontSize: 13, color: '#6B7280' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  ingredientRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bullet: { color: '#4F46E5', fontSize: 16, fontWeight: '700' },
  ingredientText: { fontSize: 15, color: '#374151', flex: 1 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stepNum: { width: 28, height: 28, backgroundColor: '#4F46E5', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepText: { fontSize: 15, color: '#374151', flex: 1, lineHeight: 22 },
});
