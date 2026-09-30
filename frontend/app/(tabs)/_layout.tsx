import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#0D9488', tabBarInactiveTintColor: '#9CA3AF', headerStyle: {backgroundColor: '#0D9488'}, headerTintColor: '#FFF' }}>
            <Tabs.Screen
                name="dashboard"
                options={{ 
                    title: 'Início', 
                    headerTitle: 'Resumo Geral', 
                    tabBarIcon: ({color}) => <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />
                }}
            />

            <Tabs.Screen
                name="contas"
                options={{
                    title: 'Contas',
                    headerTitle: 'Minhas Contas',
                    tabBarIcon: ({color}) => <MaterialCommunityIcons name="format-list-bulleted" size={24} color={color} />
                }}
            />
            
            <Tabs.Screen
                name="historico"
                options={{
                    title: 'Histórico',
                    headerTitle: 'Contas Pagas',
                    tabBarIcon: ({color}) => <MaterialCommunityIcons name="history" size={24} color={color} />
                }}
            />

            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Perfil',
                    headerTitle: 'Meu Perfil',
                    tabBarIcon: ({color}) => <MaterialCommunityIcons name="account" size={24} color={color} />
                }}
            />
        </Tabs>
    );
}