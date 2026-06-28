import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const TOPICS = [
  { id: 'akafen', name: 'Akafen', icon: 'cart-outline', questions: 16 },
  { id: 'gesondheet', name: 'Gesondheet', icon: 'heart-outline', questions: 13 },
  { id: 'kaddoen', name: 'Kaddoen', icon: 'gift-outline', questions: 12 },
  { id: 'kreativitaeit-hobbyen', name: 'Kreativitéit & Hobbyen', icon: 'color-palette-outline', questions: 10 },
  { id: 'liesen', name: 'Liesen', icon: 'book-outline', questions: 22 },
  { id: 'medien-technologien', name: 'Medien & Technologien', icon: 'phone-portrait-outline', questions: 19 },
  { id: 'moud-kleeder', name: 'Moud & Kleeder', icon: 'shirt-outline', questions: 13 },
  { id: 'musek', name: 'Musek', icon: 'musical-notes-outline', questions: 14 },
  { id: 'reesen-vakanz', name: 'Reesen & Vakanz', icon: 'airplane-outline', questions: 15 },
  { id: 'sport', name: 'Sport', icon: 'football-outline', questions: 12 },
  { id: 'sproochen', name: 'Sproochen', icon: 'chatbubbles-outline', questions: 15 },
  { id: 'stot-machen', name: 'De Stot Maachen', icon: 'home-outline', questions: 18 },
  { id: 'summer-wantar', name: 'Summer & Wanter', icon: 'sunny-outline', questions: 12 },
  { id: 'tourismus', name: 'Tourismus', icon: 'map-outline', questions: 15 },
  { id: 'transport', name: 'Transport', icon: 'bus-outline', questions: 11 },
  { id: 'wunnen', name: 'Wunnen', icon: 'business-outline', questions: 18 },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>SPROOCHENTEST</Text>
        <Text style={styles.headerTitle}>Speaking Practice</Text>
        <Text style={styles.headerDesc}>
          16 topics · 236 questions · Audio pronunciation
        </Text>
      </View>

      {/* Topics Grid */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {TOPICS.map((topic) => (
          <TouchableOpacity key={topic.id} style={styles.topicCard} activeOpacity={0.7}>
            <View style={styles.topicIcon}>
              <Ionicons name={topic.icon} size={24} color="#a78bfa" />
            </View>
            <View style={styles.topicInfo}>
              <Text style={styles.topicName}>{topic.name}</Text>
              <Text style={styles.topicMeta}>{topic.questions} questions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0d1a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1b2e',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#9333ea',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  headerDesc: {
    fontSize: 14,
    color: '#9ca3af',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1726',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2d2640',
  },
  topicIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2d2640',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 2,
  },
  topicMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
});
