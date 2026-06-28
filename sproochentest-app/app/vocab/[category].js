import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VOCAB_CATEGORIES } from '../data/vocab';

const AUDIO_BASE = 'https://hasanjaffal.com/assets/audio/vocab';
const { width } = Dimensions.get('window');

export default function FlashcardScreen() {
  const { category: categoryId } = useLocalSearchParams();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const soundRef = useRef(null);

  const category = VOCAB_CATEGORIES.find((c) => c.id === categoryId);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Category not found</Text>
      </View>
    );
  }

  const word = category.words[currentIndex];
  const totalWords = category.words.length;

  const trackWord = async () => {
    try {
      const reviewed = await AsyncStorage.getItem('reviewedWords');
      const set = new Set(JSON.parse(reviewed || '[]'));
      set.add(word.id);
      await AsyncStorage.setItem('reviewedWords', JSON.stringify([...set]));
    } catch (e) {}
  };

  const nextCard = () => {
    trackWord();
    setShowTranslation(false);
    setCurrentIndex((prev) => (prev + 1) % totalWords);
  };

  const prevCard = () => {
    setShowTranslation(false);
    setCurrentIndex((prev) => (prev - 1 + totalWords) % totalWords);
  };

  const playAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setPlayingAudio(true);
      const url = `${AUDIO_BASE}/${categoryId}/${word.id}.m4a`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAudio(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      setPlayingAudio(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f3f4f6" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{category.name}</Text>
          <Text style={styles.headerDesc}>
            {currentIndex + 1} / {totalWords}
          </Text>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.flashcard}
          activeOpacity={0.9}
          onPress={() => setShowTranslation(!showTranslation)}
        >
          <Text style={styles.posLabel}>{word.pos}</Text>
          <Text style={styles.wordLb}>{word.lb}</Text>

          {showTranslation ? (
            <Text style={styles.wordEn}>{word.en}</Text>
          ) : (
            <Text style={styles.tapHint}>Tap to reveal translation</Text>
          )}

          <TouchableOpacity style={styles.audioBtn} onPress={playAudio}>
            <Ionicons
              name={playingAudio ? 'volume-high' : 'volume-medium-outline'}
              size={24}
              color="#9333ea"
            />
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.navBtn} onPress={prevCard}>
            <Ionicons name="arrow-back" size={24} color="#f3f4f6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtnPrimary} onPress={nextCard}>
            <Text style={styles.nextText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${((currentIndex + 1) / totalWords) * 100}%` }]}
          />
        </View>
      </View>
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
  cardContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  flashcard: {
    backgroundColor: '#1a1726', borderRadius: 16, padding: 32,
    borderWidth: 1, borderColor: '#2d2640', alignItems: 'center',
    minHeight: 280, justifyContent: 'center',
  },
  posLabel: {
    fontSize: 11, fontWeight: '600', color: '#9333ea', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 16,
  },
  wordLb: { fontSize: 28, fontWeight: '800', color: '#f3f4f6', textAlign: 'center', marginBottom: 16 },
  wordEn: { fontSize: 20, color: '#a78bfa', textAlign: 'center', marginBottom: 16 },
  tapHint: { fontSize: 14, color: '#6b7280', fontStyle: 'italic' },
  audioBtn: {
    marginTop: 20, width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#2d2640', alignItems: 'center', justifyContent: 'center',
  },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 24 },
  navBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#2d2640',
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24,
    height: 48, borderRadius: 24, backgroundColor: '#9333ea',
  },
  nextText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  progressBar: {
    height: 4, backgroundColor: '#2d2640', borderRadius: 2,
    marginTop: 24, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#9333ea', borderRadius: 2 },
  errorText: { color: '#f3f4f6', fontSize: 16, textAlign: 'center', marginTop: 100 },
});
