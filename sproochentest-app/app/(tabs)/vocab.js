import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { VOCAB_TIERS, VOCAB_CATEGORIES } from '../data/vocab';

export default function VocabScreen() {
  const router = useRouter();

  const totalWords = VOCAB_CATEGORIES.reduce((sum, c) => sum + c.words.length, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>SPROOCHENTEST</Text>
        <Text style={styles.headerTitle}>Vocabulary</Text>
        <Text style={styles.headerDesc}>
          {VOCAB_CATEGORIES.length} categories · {totalWords} words · 4 tiers
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {VOCAB_TIERS.map((tier) => (
          <View key={tier.id} style={styles.tierSection}>
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>{tier.name}</Text>
              <Text style={styles.tierDesc}>{tier.description}</Text>
            </View>

            {tier.categories.map((category) => (
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
          </View>
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
  scrollContent: { padding: 16, paddingBottom: 40 },
  tierSection: { marginBottom: 28 },
  tierHeader: { marginBottom: 12, paddingHorizontal: 4 },
  tierName: { fontSize: 18, fontWeight: '700', color: '#a78bfa', marginBottom: 4 },
  tierDesc: { fontSize: 13, color: '#6b7280' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1726',
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2d2640',
    marginBottom: 8,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#2d2640',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#f3f4f6', marginBottom: 2 },
  cardMeta: { fontSize: 11, color: '#6b7280' },
});
