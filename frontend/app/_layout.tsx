import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { useFonts, Lobster_400Regular } from '@expo-google-fonts/lobster';
import { Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto'
import { ActivityIndicator, View } from 'react-native';
import { CORES } from '@/src/styles/tema';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lobster_400Regular,
    Roboto_400Regular,
    Roboto_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={CORES.verdeprincipal}/>
      </View>
    );
  }
  
  return (
    <AuthProvider>
      <Stack 
        screenOptions={{ 
          headerStyle: { backgroundColor: CORES.verdeprincipal },
          headerTintColor: CORES.branco,
          headerTitleStyle: { fontFamily: 'Roboto_700Bold' },
          headerBackTitle: 'Voltar',
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }}/>
        <Stack.Screen name="cadastro" options={{ headerShown: false }}/>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
      </Stack>
    </AuthProvider>
  );
}