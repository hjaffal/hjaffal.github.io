import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TOPICS } from '../data/topics';
import { VOCAB_CATEGORIES } from '../data/vocab';

export default function ProgressScreen() {
  const [stats, setStats] = useState({
    topicsVisited: 0,
    wordsReviewed: 0,
    totalTopics: TOPICS.length,
    totalWords: VOCAB_CATEGORIES.reduce((sum, c) => sum + c.words.length, 0),
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLB, setLoadingLB] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadLeaderboard();
    }, [])
  );

  const loadStats = async () => {
    try {
      const visited = await AsyncStorage.getItem('visitedTopics');
      const reviewed = await AsyncStorage.getItem('reviewedWords');
      setStats((prev) => ({
        ...prev,
        topicsVisited: visited ? JSON.parse(visited).length : 0,
        wordsReviewed: reviewed ? JSON.parse(reviewed).length : 0,
      }));
    } catch (e) {}
  };

  const loadLeaderboard = async () => {
    try {
      setLoadingLB(true);
      const q = query(
        collection(db, 'vocab_progress'),
        orderBy('stats.totalXp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const entries = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          name: data.displayName || 'Anonymous',
          xp: (data.stats && data.stats.totalXp) || 0,
        });
      });
      setLeaderboard(entries);
    } catch (e) {
      console.log('Leaderboard error:', e.message);
    } finally {
      setLoadingLB(false);
    }
  };

  const StatCard = ({ icon, label, value, total, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>  
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min((value / total) * 100, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.statTotal}>{value} / {total}</Text>
    </View>
  );

  const getRankStyle = (rank) => {
    if (rank === 1) return { backgroundColor: '#fbbf2420', borderColor: '#fbbf24' };
    if (rank === 2) return { backgroundColor: '#94a3b820', borderColor: '#94a3b8' };
    if (rank === 3) return { backgroundColor: '#cd7f3220', borderColor: '#cd7f32' };
    return {};
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>SPROOCHENTEST</Text>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerDesc}>Track your learning journey</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsGrid}>
          <StatCard
            icon="mic-outline"
            label="Topics Visited"
            value={stats.topicsVisited}
            total={stats.totalTopics}
            color="#9333ea"
          />
          <StatCard
            icon="book-outline"
            label="Words Reviewed"
            value={stats.wordsReviewed}
            total={stats.totalWords}
            color="#06b6d4"
          />
        </View>

        {/* Leaderboard */}
        <View style={styles.lbCard}>
          <View style={styles.lbHeader}>
            <Text style={styles.lbTitle}>🏆 Leaderboard</Text>
            <Text style={styles.lbSubtitle}>Top 10 learners</Text>
          </View>

          {loadingLB ? (
            <ActivityIndicator size="small" color="#9333ea" style={{ marginVertical: 20 }} />
          ) : leaderboard.length === 0 ? (
            <Text style={styles.lbEmpty}>No learners yet. Be the first!</Text>
          ) : (
            leaderboard.map((entry, index) => {
              const rank = index + 1;
              const rankBadge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
              return (
                <View key={entry.id} style={[styles.lbRow, getRankStyle(rank)]}>
                  <Text style={styles.lbRank}>{rankBadge}</Text>
                  <View style={styles.lbAvatar}>
                    <Text style={styles.lbAvatarText}>
                      {(entry.name.charAt(0) || 'L').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.lbName} numberOfLines={1}>{entry.name}</Text>
                  <Text style={styles.lbXp}>{entry.xp} XP</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color="#fbbf24" />
          <Text style={styles.tipText}>
            Practice speaking topics daily and review flashcards to build your vocabulary for the Sproochentest.
          </Text>
        </View>
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
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#1a1726', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2d2640', alignItems: 'center',
  },
  statIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  statValue: { fontSize: 32, fontWeight: '800', color: '#f3f4f6', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#9ca3af', marginBottom: 12 },
  progressBar: {
    width: '100%', height: 6, backgroundColor: '#2d2640', borderRadius: 3, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  statTotal: { fontSize: 11, color: '#6b7280' },

  // Leaderboard
  lbCard: {
    backgroundColor: '#1a1726', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2d2640', marginBottom: 16,
  },
  lbHeader: { marginBottom: 14 },
  lbTitle: { fontSize: 18, fontWeight: '700', color: '#f3f4f6', marginBottom: 2 },
  lbSubtitle: { fontSize: 12, color: '#6b7280' },
  lbEmpty: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingVertical: 20 },
  lbRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    paddingHorizontal: 8, borderRadius: 8, marginBottom: 4,
    borderWidth: 1, borderColor: 'transparent',
  },
  lbRank: { fontSize: 16, width: 32, textAlign: 'center', color: '#f3f4f6' },
  lbAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#2d2640',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  lbAvatarText: { fontSize: 14, fontWeight: '700', color: '#a78bfa' },
  lbName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#f3f4f6' },
  lbXp: { fontSize: 14, fontWeight: '700', color: '#9333ea' },

  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#1a1726', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2d2640',
  },
  tipText: { flex: 1, fontSize: 14, color: '#9ca3af', lineHeight: 20 },
});
