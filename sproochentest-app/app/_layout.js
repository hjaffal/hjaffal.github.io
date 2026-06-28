import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './lib/auth-context';
import AuthScreen from './lib/AuthScreen';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0d1a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#9333ea" />
      </View>
    );
  }

  // Not logged in — show auth screen directly (no routing)
  if (!user) {
    return <AuthScreen />;
  }

  // Logged in — show the app
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
