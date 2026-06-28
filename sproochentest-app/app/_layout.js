import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';
import { AuthProvider, useAuth } from './lib/auth-context';
import { auth } from './lib/firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

function InlineAuth() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '760741109890-dp38reicl2aen3jm7e6orcuj92tueo1c.apps.googleusercontent.com',
    webClientId: '760741109890-25vautp1ena3ubti5ei1fnhjqhnpqkfd.apps.googleusercontent.com',
  });

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      const result = await promptAsync();
      if (result?.type === 'success') {
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        await signInWithCredential(auth, credential);
      }
    } catch (err) {
      setError('Google sign-in failed: ' + (err.message || ''));
    }
  };

  const handleSubmit = async () => {
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
      const map = {
        'auth/email-already-in-use': 'Email already registered. Try signing in.',
        'auth/invalid-email': 'Invalid email.',
        'auth/weak-password': 'Password must be 6+ characters.',
        'auth/user-not-found': 'No account with this email.',
        'auth/wrong-password': 'Wrong password.',
        'auth/invalid-credential': 'Invalid credentials.',
      };
      setError(map[err.code] || err.code + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>SPROOCHENTEST</Text>
        <Text style={s.title}>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</Text>
        <Text style={s.desc}>{mode === 'signup' ? 'Sign up to track your progress.' : 'Sign in to continue learning.'}</Text>

        <TouchableOpacity style={s.googleBtn} onPress={handleGoogleSignIn} activeOpacity={0.8}>
          <Ionicons name="logo-google" size={20} color="#fff" />
          <Text style={s.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        {mode === 'signup' && (
          <TextInput style={s.input} placeholder="Display Name" placeholderTextColor="#6b7280" value={name} onChangeText={setName} autoCapitalize="words" />
        )}
        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#6b7280" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor="#6b7280" value={password} onChangeText={setPassword} secureTextEntry />

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.toggle} onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
          <Text style={s.toggleText}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={s.toggleLink}>{mode === 'login' ? 'Sign Up' : 'Sign In'}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0d1a' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#9333ea', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  desc: { fontSize: 14, color: '#9ca3af', marginBottom: 24 },
  input: { backgroundColor: '#1a1726', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2d2640', color: '#f3f4f6', fontSize: 15, marginBottom: 12 },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 12 },
  btn: { backgroundColor: '#9333ea', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#2d2640', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#3d3650', marginBottom: 4 },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#f3f4f6' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2d2640' },
  dividerText: { paddingHorizontal: 12, fontSize: 13, color: '#6b7280' },
  toggle: { alignItems: 'center', marginTop: 20 },
  toggleText: { fontSize: 14, color: '#9ca3af' },
  toggleLink: { color: '#a78bfa', fontWeight: '600' },
});

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0d1a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    );
  }

  if (!user) {
    return <InlineAuth />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f0d1a' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="speaking/[topic]" />
      <Stack.Screen name="vocab/[category]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppContent />
    </AuthProvider>
  );
}
