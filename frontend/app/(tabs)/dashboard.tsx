import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import api from '../../src/api/api';

export default function Dashboard() {
    const [dados, setDados] = useState<any>(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const carregarDashboard = async () => {
            try {
                const resposta = await api.get('/dashboard');
                setDados(resposta.data);
            } catch (erro) {
                console.error("Erro ao carregar o dashboard: ", erro);
            } finally {
                setCarregando(false);
            }
        };
        carregarDashboard();
    }, []);

    if (carregando) {
        return (
            <View style={styles.centro}>
                <ActivityIndicator size="large" color="#0D9488" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.nomeCasa}>{dados?.nome_residencia}</Text>
                <Text style={styles.labelTotal}>Gasto no mês atual</Text>
                <Text style={styles.valorTotal}>R$ {dados?.total_pago_mes_atual}</Text>
            </View>

            <View style={styles.linhaCards}>
                <View style={styles.card}>
                    <Text style={styles.tituloCard}>Pendentes</Text>
                    <Text style={[styles.valorCard, { color: '#F59E0B' }]}>
                        R$ {dados?.resumo_status?.pendente?.total || '0.00'}
                    </Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.tituloCard}>Atrasadas</Text>
                    <Text style={[styles.valorCard, { color: '#EF4444' }]}>
                        R$ {dados?.resumo_status?.atrasado?.total || '0.00'}
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#0D9488', padding: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center' },
    nomeCasa: { color: '#CCFBF1', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
    labelTotal: { color: '#FFF', marginTop: 10, fontSize: 16 },
    valorTotal: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
    linhaCards: { flexDirection: 'row', padding: 20, justifyContent: 'space-between' },
    card: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, width: '48%', elevation: 3 },
    tituloCard: { color: '#6B7280', fontSize: 14 },
    valorCard: { fontSize: 20, fontWeight: 'bold', marginTop: 5 }
});