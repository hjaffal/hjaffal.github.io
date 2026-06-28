import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../lib/auth-context';
import { loadProgressFromFirestore } from '../lib/progress';
import { TOPICS } from '../data/topics';
import { VOCAB_CATEGORIES } from '../data/vocab';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    topicsVisited: 0,
    wordsReviewed: 0,
    xp: 0,
    totalTopics: TOPICS.length,
    totalWords: VOCAB_CATEGORIES.reduce((sum, c) => sum + c.words.length, 0),
  });
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      if (!user) return;
      // Load from Firestore (same as web)
      const progress = await loadProgressFromFirestore(user.uid);
      const wordsReviewed = Object.keys(progress.words || {}).length;
      const xp = (progress.stats && progress.stats.totalXp) || 0;

      // Topics visited from AsyncStorage (local to device)
      const visited = await AsyncStorage.getItem('visitedTopics');

      setStats((prev) => ({
        ...prev,
        topicsVisited: visited ? JSON.parse(visited).length : 0,
        wordsReviewed,
        xp,
      }));
    } catch (e) {}
  };

  const handleEditName = () => {
    setNewName(user?.displayName || '');
    setEditing(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: newName.trim() });
      Alert.alert('Success', 'Your display name has been updated.');
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { getAuth } = require('firebase/auth');
      const { signOut: firebaseSignOut } = require('firebase/auth');
      const currentAuth = getAuth();
      await firebaseSignOut(currentAuth);
    } catch (e) {
      // Fallback: clear AsyncStorage auth state manually
      try {
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter(k => k.startsWith('firebase:'));
        if (authKeys.length > 0) await AsyncStorage.multiRemove(authKeys);
      } catch (e2) {}
    }
  };

  const displayName = user?.displayName || 'Learner';
  const avatarLetter = (displayName.charAt(0) || 'L').toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>SPROOCHENTEST</Text>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerDesc}>Your account and stats</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Avatar and User Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>

          {editing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter display name"
                placeholderTextColor="#6b7280"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.editCancelBtn}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.editCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editSaveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSaveName}
                  disabled={saving}
                >
                  <Text style={styles.editSaveText}>
                    {saving ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={handleEditName} activeOpacity={0.7}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName}>{displayName}</Text>
                <Ionicons name="pencil-outline" size={16} color="#6b7280" />
              </View>
              <Text style={styles.editHint}>Tap to edit</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#9333ea20' }]}>
                <Ionicons name="mic-outline" size={24} color="#9333ea" />
              </View>
              <Text style={styles.statValue}>{stats.topicsVisited}</Text>
              <Text style={styles.statLabel}>Topics Visited</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((stats.topicsVisited / stats.totalTopics) * 100, 100)}%`,
                      backgroundColor: '#9333ea',
                    },
                  ]}
                />
              </View>
              <Text style={styles.statTotal}>{stats.topicsVisited} / {stats.totalTopics}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#06b6d420' }]}>
                <Ionicons name="book-outline" size={24} color="#06b6d4" />
              </View>
              <Text style={styles.statValue}>{stats.wordsReviewed}</Text>
              <Text style={styles.statLabel}>Words Reviewed</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((stats.wordsReviewed / stats.totalWords) * 100, 100)}%`,
                      backgroundColor: '#06b6d4',
                    },
                  ]}
                />
              </View>
              <Text style={styles.statTotal}>{stats.wordsReviewed} / {stats.totalWords}</Text>
            </View>
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color="#fbbf24" />
          <Text style={styles.tipText}>
            Practice speaking topics daily and review flashcards to build your vocabulary for the Sproochentest.
          </Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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

  // Profile Card
  profileCard: {
    alignItems: 'center', backgroundColor: '#1a1726', borderRadius: 12, padding: 24,
    borderWidth: 1, borderColor: '#2d2640', marginBottom: 20,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#9333ea',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#ffffff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  displayName: { fontSize: 20, fontWeight: '700', color: '#f3f4f6' },
  editHint: { fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 2 },
  email: { fontSize: 14, color: '#9ca3af', marginTop: 8 },

  // Edit Name
  editContainer: { width: '100%', alignItems: 'center' },
  editInput: {
    width: '100%', backgroundColor: '#0f0d1a', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#9333ea', color: '#f3f4f6', fontSize: 16,
    textAlign: 'center',
  },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  editCancelBtn: {
    paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8,
    backgroundColor: '#2d2640',
  },
  editCancelText: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  editSaveBtn: {
    paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8,
    backgroundColor: '#9333ea',
  },
  editSaveText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },

  // Stats
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f3f4f6', marginBottom: 12 },
  statsSection: { marginBottom: 20 },
  statsGrid: { flexDirection: 'row', gap: 12 },
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

  // Tip
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#1a1726', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2d2640', marginBottom: 20,
  },
  tipText: { flex: 1, fontSize: 14, color: '#9ca3af', lineHeight: 20 },

  // Sign Out
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#1a1726', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#ef444440',
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
});
