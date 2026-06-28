import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { VOCAB_CATEGORIES } from '../data/vocab';

export default function VocabScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>SPROOCHENTEST</Text>
        <Text style={styles.headerTitle}>Vocabulary</Text>
        <Text style={styles.headerDesc}>
          {VOCAB_CATEGORIES.length} categories · {VOCAB_CATEGORIES.reduce((sum, c) => sum + c.words.length, 0)} words · Flashcards
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {VOCAB_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(`/vocab/${category.id}`)}
          >
            <View style={styles.cardIcon}>
              <Ionicons name={category.icon} size={24} color="#a78bfa" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{category.name}</Text>
              <Text style={styles.cardMeta}>
                {category.words.length} words · {category.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0d1a' },
  header: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24,
    borderBottomWidth: 1, borderBottomColor: '#1f1b2e',
  },
  headerLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#9333ea', marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 6 },
  headerDesc: { fontSize: 14, color: '#9ca3af' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1726',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2d2640',
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#2d2640',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#f3f4f6', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: '#6b7280' },
});
