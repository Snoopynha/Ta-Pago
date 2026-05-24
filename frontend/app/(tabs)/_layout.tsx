import { Tabs } from 'expo-router';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#0D9488' }}>
            <Tabs.Screen
                name="dashboard"
                options={{ title: 'Dashboard', headerTitle: 'Resumo Geral' }}
            />
        </Tabs>
    );
}