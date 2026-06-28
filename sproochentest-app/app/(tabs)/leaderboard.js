import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../lib/auth-context';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [])
  );

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return { backgroundColor: '#fbbf2420', borderColor: '#fbbf24' };
    if (rank === 2) return { backgroundColor: '#94a3b820', borderColor: '#94a3b8' };
    if (rank === 3) return { backgroundColor: '#cd7f3220', borderColor: '#cd7f32' };
    return {};
  };

  const isCurrentUser = (entry) => {
    if (!user) return false;
    return entry.id === user.uid;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>SPROOCHENTEST</Text>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerDesc}>Top 10 learners by XP</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.lbCard}>
          <View style={styles.lbHeader}>
            <Ionicons name="trophy" size={22} color="#fbbf24" />
            <Text style={styles.lbTitle}>Top Learners</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#9333ea" style={{ marginVertical: 40 }} />
          ) : leaderboard.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#2d2640" />
              <Text style={styles.lbEmpty}>No learners yet. Be the first!</Text>
              <Text style={styles.lbEmptyHint}>Review vocabulary to earn XP and appear here.</Text>
            </View>
          ) : (
            leaderboard.map((entry, index) => {
              const rank = index + 1;
              const rankBadge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
              const highlighted = isCurrentUser(entry);
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.lbRow,
                    getRankStyle(rank),
                    highlighted && styles.lbRowHighlighted,
                  ]}
                >
                  <Text style={styles.lbRank}>{rankBadge}</Text>
                  <View style={[styles.lbAvatar, highlighted && styles.lbAvatarHighlighted]}>
                    <Text style={styles.lbAvatarText}>
                      {(entry.name.charAt(0) || 'L').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.lbNameContainer}>
                    <Text style={[styles.lbName, highlighted && styles.lbNameHighlighted]} numberOfLines={1}>
                      {entry.name}
                    </Text>
                    {highlighted && <Text style={styles.lbYou}>You</Text>}
                  </View>
                  <Text style={styles.lbXp}>{entry.xp} XP</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="flash-outline" size={20} color="#fbbf24" />
          <Text style={styles.tipText}>
            Earn XP by reviewing vocabulary flashcards. The more you practice, the higher you climb!
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
  lbCard: {
    backgroundColor: '#1a1726', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2d2640', marginBottom: 16,
  },
  lbHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  lbTitle: { fontSize: 18, fontWeight: '700', color: '#f3f4f6' },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  lbEmpty: { fontSize: 16, fontWeight: '600', color: '#9ca3af', marginTop: 12 },
  lbEmptyHint: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  lbRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    paddingHorizontal: 10, borderRadius: 10, marginBottom: 6,
    borderWidth: 1, borderColor: 'transparent',
  },
  lbRowHighlighted: {
    backgroundColor: '#9333ea15', borderColor: '#9333ea50',
  },
  lbRank: { fontSize: 18, width: 36, textAlign: 'center', color: '#f3f4f6' },
  lbAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#2d2640',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  lbAvatarHighlighted: { backgroundColor: '#9333ea' },
  lbAvatarText: { fontSize: 15, fontWeight: '700', color: '#a78bfa' },
  lbNameContainer: { flex: 1 },
  lbName: { fontSize: 15, fontWeight: '500', color: '#f3f4f6' },
  lbNameHighlighted: { fontWeight: '700', color: '#ffffff' },
  lbYou: { fontSize: 11, color: '#9333ea', fontWeight: '600', marginTop: 1 },
  lbXp: { fontSize: 15, fontWeight: '700', color: '#9333ea' },
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#1a1726', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2d2640',
  },
  tipText: { flex: 1, fontSize: 14, color: '#9ca3af', lineHeight: 20 },
});
