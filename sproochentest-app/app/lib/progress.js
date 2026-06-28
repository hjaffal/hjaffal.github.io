/**
 * Progress sync module — mirrors the web vocab-engine's Firestore sync.
 * Collection: vocab_progress, document: user.uid
 * Structure: { words: { wordId: { box, correct, incorrect } }, stats: { totalXp }, displayName, lastUpdated }
 *
 * Same credentials, same data — web and app share progress.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';

const CACHE_KEY_PREFIX = 'sp_vocab_progress_';

function getCacheKey(uid) {
  return CACHE_KEY_PREFIX + uid;
}

/**
 * Load progress from AsyncStorage (fast local cache).
 */
export async function loadProgressFromCache(uid) {
  try {
    const data = await AsyncStorage.getItem(getCacheKey(uid));
    return data ? JSON.parse(data) : { words: {}, stats: { totalXp: 0 } };
  } catch (e) {
    return { words: {}, stats: { totalXp: 0 } };
  }
}

/**
 * Save progress to AsyncStorage.
 */
export async function saveProgressToCache(uid, progress) {
  try {
    await AsyncStorage.setItem(getCacheKey(uid), JSON.stringify(progress));
  } catch (e) {}
}

/**
 * Load progress from Firestore (source of truth).
 * Merges with local cache — uses whichever has more progress.
 */
export async function loadProgressFromFirestore(uid) {
  try {
    const docRef = doc(db, 'vocab_progress', uid);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      const firestoreData = snapshot.data();
      const localProgress = await loadProgressFromCache(uid);

      const firestoreXp = (firestoreData.stats && firestoreData.stats.totalXp) || 0;
      const localXp = (localProgress.stats && localProgress.stats.totalXp) || 0;
      const firestoreWords = firestoreData.words ? Object.keys(firestoreData.words).length : 0;
      const localWords = Object.keys(localProgress.words).length;

      let progress;
      if (firestoreXp >= localXp || firestoreWords > localWords) {
        // Firestore is ahead — use it
        progress = {
          words: firestoreData.words || {},
          stats: firestoreData.stats || { totalXp: 0 },
        };
      } else {
        // Local is ahead — push to Firestore
        progress = localProgress;
        await saveProgressToFirestore(uid, progress, firestoreData.displayName || 'Learner');
      }

      await saveProgressToCache(uid, progress);
      return progress;
    } else {
      // No Firestore doc — return local cache (may be empty for new users)
      const localProgress = await loadProgressFromCache(uid);
      return localProgress;
    }
  } catch (e) {
    console.warn('Firestore load failed, using cache:', e.message);
    return await loadProgressFromCache(uid);
  }
}

/**
 * Save progress to Firestore.
 */
export async function saveProgressToFirestore(uid, progress, displayName) {
  try {
    const docRef = doc(db, 'vocab_progress', uid);
    await setDoc(docRef, {
      words: progress.words,
      stats: progress.stats,
      displayName: displayName || 'Learner',
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn('Firestore write failed:', e.message);
  }
}

/**
 * Record a word review and sync to Firestore.
 * Matches the web's logic for XP and word tracking.
 */
export async function recordWordReview(uid, wordId, correct, displayName) {
  const progress = await loadProgressFromCache(uid);

  // Update word progress
  const wordProgress = progress.words[wordId] || { box: 0, correct: 0, incorrect: 0 };
  if (correct) {
    wordProgress.correct = (wordProgress.correct || 0) + 1;
    wordProgress.box = Math.min((wordProgress.box || 0) + 1, 5);
    progress.stats.totalXp = (progress.stats.totalXp || 0) + 10;
  } else {
    wordProgress.incorrect = (wordProgress.incorrect || 0) + 1;
    wordProgress.box = 0;
  }
  progress.words[wordId] = wordProgress;

  // Save locally
  await saveProgressToCache(uid, progress);

  // Debounced Firestore save (save after each review for now — not heavy with single doc writes)
  await saveProgressToFirestore(uid, progress, displayName);

  return progress;
}
