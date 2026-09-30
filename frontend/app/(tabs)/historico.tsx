import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import api from '../../src/api/api';

export default function Historico() {
    const [historico, setHistorico] = useState([]);

    useEffect(() => {
        const carregarHistorico = async () => {
            try {
                const resposta = await api.get('/historico');
                setHistorico(resposta.data);
            } catch (erro) {
                console.error("Erro ao carregar o histórico: ", erro);
            }
        };
        carregarHistorico();
    }, []);

    const renderItem = ({ item }: any) => {
        const dataFormatada = new Date(item.data_pagamento).toLocaleDateString('pt-PT');

        return (
            <View style={styles.cardHistorico}>
                <View>
                    <Text style={styles.titulo}>{item.nome_conta}</Text>
                    <Text style={styles.data}>Pago em {dataFormatada}</Text>
                </View>
                <Text style={styles.valor}>R$ {item.valor_pago}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={historico}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 20 }}
                ListEmptyComponent={<Text style={styles.vazio}>Nenhum histórico encontrado.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    cardHistorico: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    titulo: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    data: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    valor: { fontSize: 16, fontWeight: 'bold', color: '#10B981' },
    vazio: { textAlign: 'center', marginTop: 50, color: '#6B7280', fontSize: 16 }
});