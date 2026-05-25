import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/contexts/AuthContext';

export default function Perfil() {
    const router = useRouter();
    const { user } = useAuth();

    const handleLogout = async () => {
        await AsyncStorage.removeItem('@HomeFinance:token');
        await AsyncStorage.removeItem('@HomeFinance:user');
        router.replace('/');
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.name}>Olá, {user?.nome || 'Utilizador'}!</Text>
                <Text style={styles.info}>E-mail: {user?.email}</Text>
                <Text style={styles.info}>
                    Código da sua Residência: <Text style={styles.bold}>{user?.codigo_convite}</Text>
                </Text>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Sair da Conta</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
    card: { backgroundColor: '#FFF', padding: 20, borderRadius: 10, marginBottom: 20, elevation: 2 },
    name: { fontSize: 22, fontWeight: 'bold', color: '#0D9488', marginBottom: 15 },
    info: { fontSize: 16, color: '#4B5563', marginBottom: 8 },
    bold: { fontWeight: 'bold', color: '#1F2937' },
    logoutButton: { backgroundColor: '#EF4444', padding: 15, borderRadius: 8, alignItems: 'center' },
    logoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});