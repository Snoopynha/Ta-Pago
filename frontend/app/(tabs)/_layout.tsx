import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CORES, FONTE, TAMANHOS } from '@/src/styles/tema';

export default function TabsLayout() {
    return (
        <Tabs 
            screenOptions={{ 
                tabBarActiveTintColor: CORES.verdeprincipal, 
                tabBarInactiveTintColor: CORES.cinza, 
                headerStyle: { backgroundColor: CORES.verdeprincipal },
                headerTintColor: CORES.branco, 
                headerTitleStyle: { fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m },
                tabBarStyle: {
                    backgroundColor: CORES.branco,
                    borderTopWidth: 1,
                    borderTopColor: CORES.borda,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: { fontFamily: FONTE.regular, fontSize: TAMANHOS.fontSize.p },
            }}>
            <Tabs.Screen
                name="dashboard"
                options={{ 
                    title: 'Início', 
                    headerTitle: 'Resumo Geral', 
                    tabBarIcon: ({color}) => <MaterialCommunityIcons name="view-dashboard" size={TAMANHOS.fontSize.xg} color={color} />
                }}
            />

            <Tabs.Screen
                name="contas"
                options={{
                    title: 'Contas',
                    headerTitle: 'Minhas Contas',
                    tabBarIcon: ({color}) => <MaterialCommunityIcons name="format-list-bulleted" size={TAMANHOS.fontSize.xg} color={color} />
                }}
            />
            
            <Tabs.Screen
                name="historico"
                options={{
                    title: 'Histórico',
                    headerTitle: 'Contas Pagas',
                    tabBarIcon: ({color}) => <MaterialCommunityIcons name="history" size={TAMANHOS.fontSize.xg} color={color} />
                }}
            />

            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Perfil',
                    headerTitle: 'Meu Perfil',
                    tabBarIcon: ({color}) => <MaterialCommunityIcons name="account" size={TAMANHOS.fontSize.xg} color={color} />
                }}
            />
        </Tabs>
    );
}