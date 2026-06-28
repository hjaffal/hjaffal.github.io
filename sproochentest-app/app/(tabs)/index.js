import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOPICS } from '../data/topics';

export default function SpeakingScreen() {
  const router = useRouter();

  const handleTopicPress = async (topic) => {
    // Track visited topics
    try {
      const visited = await AsyncStorage.getItem('visitedTopics');
      const set = new Set(JSON.parse(visited || '[]'));
      set.add(topic.id);
      await AsyncStorage.setItem('visitedTopics', JSON.stringify([...set]));
    } catch (e) {}
    router.push(`/speaking/${topic.id}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>SPROOCHENTEST</Text>
        <Text style={styles.headerTitle}>Speaking Practice</Text>
        <Text style={styles.headerDesc}>
          {TOPICS.length} topics · {TOPICS.reduce((sum, t) => sum + t.questions.length, 0)} questions · Audio pronunciation
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={styles.topicCard}
            activeOpacity={0.7}
            onPress={() => handleTopicPress(topic)}
          >
            <View style={styles.topicIcon}>
              <Ionicons name={topic.icon} size={24} color="#a78bfa" />
            </View>
            <View style={styles.topicInfo}>
              <Text style={styles.topicName}>{topic.name}</Text>
              <Text style={styles.topicMeta}>
                {topic.subtitle} · {topic.questions.length} questions
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
