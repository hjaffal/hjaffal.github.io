import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useState, useRef, useEffect } from 'react';
import { TOPICS } from '../data/topics';

const AUDIO_BASE = 'https://hasanjaffal.com/assets/audio/questions';

export default function TopicDetailScreen() {
  const { topic: topicId } = useLocalSearchParams();
  const router = useRouter();
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const soundRef = useRef(null);

  const topic = TOPICS.find((t) => t.id === topicId);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  if (!topic) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Topic not found</Text>
      </View>
    );
  }

  const playAudio = async (questionId) => {
    try {
      // Stop any currently playing audio
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (playingId === questionId) {
        setPlayingId(null);
        return;
      }

      setLoadingId(questionId);
      const url = `${AUDIO_BASE}/${topicId}/${questionId}.m4a`;

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setPlayingId(questionId);
      setLoadingId(null);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      setLoadingId(null);
      setPlayingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f3f4f6" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{topic.name}</Text>
          <Text style={styles.headerDesc}>
            {topic.subtitle} · {topic.questions.length} questions
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {topic.questions.map((q, index) => (
          <View key={q.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.questionNumber}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.playBtn,
                  playingId === q.id && styles.playBtnActive,
                ]}
                onPress={() => playAudio(q.id)}
              >
                {loadingId === q.id ? (
                  <ActivityIndicator size="small" color="#9333ea" />
                ) : (
                  <Ionicons
                    name={playingId === q.id ? 'pause' : 'play'}
                    size={18}
                    color={playingId === q.id ? '#9333ea' : '#a78bfa'}
                  />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.questionLb}>{q.lb}</Text>
            <Text style={styles.questionEn}>{q.en}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0d1a' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 60,
    paddingHorizontal: 16, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#1f1b2e',
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  headerDesc: { fontSize: 13, color: '#9ca3af' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  questionCard: {
    backgroundColor: '#1a1726', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2d2640',
  },
  questionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  questionNumber: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#2d2640',
    alignItems: 'center', justifyContent: 'center',
  },
  numberText: { fontSize: 12, fontWeight: '700', color: '#9ca3af' },
  playBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#2d2640',
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnActive: { backgroundColor: '#9333ea20' },
  questionLb: { fontSize: 16, fontWeight: '600', color: '#f3f4f6', marginBottom: 6, lineHeight: 22 },
  questionEn: { fontSize: 14, color: '#9ca3af', fontStyle: 'italic', lineHeight: 20 },
  errorText: { color: '#f3f4f6', fontSize: 16, textAlign: 'center', marginTop: 100 },
});
