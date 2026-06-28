import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '760741109890-dp38reicl2aen3jm7e6orcuj92tueo1c.apps.googleusercontent.com',
    webClientId: '760741109890-25vautp1ena3ubti5ei1fnhjqhnpqkfd.apps.googleusercontent.com',
  });

  const handleEmailAuth = async () => {
    setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Name is required.'); return; }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        await signInWithCredential(auth, credential);
        
      }
    } catch (err) {
      setError('Google sign-in failed. Try email instead.');
    }
  };

  const getErrorMessage = (code) => {
    const map = {
      'auth/email-already-in-use': 'This email is already registered. Try signing in.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Invalid credentials. Check your email and password.',
    };
    return map[code] || 'Something went wrong. Try again.';
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerLabel}>SPROOCHENTEST</Text>
          <Text style={styles.headerTitle}>
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.headerDesc}>
            {mode === 'signup'
              ? 'Sign up to sync your progress across devices.'
              : 'Sign in to access your vocabulary progress.'}
          </Text>
        </View>

        <View style={styles.form}>
          {/* Google Sign-In */}
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} activeOpacity={0.8}>
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Name (signup only) */}
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#6b7280"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#6b7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Error */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleEmailAuth}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Toggle mode */}
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
          >
            <Text style={styles.toggleText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.toggleLink}>
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0d1a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32 },
  headerLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#9333ea', marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  headerDesc: { fontSize: 14, color: '#9ca3af', lineHeight: 20 },
  form: {},
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#2d2640', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#3d3650',
  },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#f3f4f6' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2d2640' },
  dividerText: { paddingHorizontal: 12, fontSize: 13, color: '#6b7280' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 6 },
  input: {
    backgroundColor: '#1a1726', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#2d2640', color: '#f3f4f6', fontSize: 15,
  },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 12 },
  submitBtn: {
    backgroundColor: '#9333ea', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  toggleBtn: { alignItems: 'center', marginTop: 20 },
  toggleText: { fontSize: 14, color: '#9ca3af' },
  toggleLink: { color: '#a78bfa', fontWeight: '600' },
});
