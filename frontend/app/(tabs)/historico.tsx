import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import api from '../../src/api/api';
import { CORES, FONTE, TAMANHOS } from '@/src/styles/tema';

// Tipagem
type ItemHistorico = {
    id: number;
    conta_nome: string;
    valor_pago: number;
    data_pagamento: string;
    usuario_nome: string;
};

export default function Historico() {
    const [historico, setHistorico] = useState<ItemHistorico[]>([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const carregarHistorico = async () => {
            try {
                const resposta = await api.get('/historico');
                setHistorico(resposta.data);
            } catch (error) {
                console.error("Erro ao carregar o histórico: ", error);
            } finally {
                setCarregando(false);
            }
        };
        carregarHistorico();
    }, []);

    if (carregando) {
        return (
            <View style={styles.centro}>
                <ActivityIndicator size="large" color={CORES.verdeprincipal}/>
            </View>
        )
    }

    const renderItem = ({ item }: { item: ItemHistorico }) => {
        const dataFormatada = new Date(item.data_pagamento).toLocaleDateString('pt-BR');
        const valorFormatado = Number(item.valor_pago).toFixed(2);

        return (
            <View style={styles.cardHistorico}>
                <View style={styles.infoEsquerda}>
                    <Text style={styles.titulo}>{item.conta_nome}</Text>
                    <Text style={styles.data}>Pago em {dataFormatada}</Text>
                    <Text style={styles.usuario}>por {item.usuario_nome}</Text>
                </View>
                <Text style={styles.valor}>R$ {valorFormatado}</Text>
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
                ListEmptyComponent={
                    <Text style={styles.vazio}>Nenhum pagamento registrado ainda.</Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CORES.fundoapp },
    centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    cardHistorico: { 
        backgroundColor: CORES.branco, 
        padding: 15, 
        borderRadius: TAMANHOS.borderRadius, 
        marginBottom: 10, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        elevation: 2,
        shadowColor: CORES.preto,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    infoEsquerda: { flex: 1, marginRight: 10 },
    titulo: { fontSize: TAMANHOS.fontSize.m, fontFamily: FONTE.bold, color: CORES.preto },
    data: { fontSize: TAMANHOS.fontSize.p, color: CORES.cinza, marginTop: 2 },
    usuario: {
        fontSize: TAMANHOS.fontSize.p,
        fontFamily: FONTE.regular,
        color: CORES.cinzaclaro,
        marginTop: 1,
    },
    valor: { fontSize: TAMANHOS.fontSize.p, fontFamily: FONTE.bold, color: CORES.verde },
    vazio: { 
        textAlign: 'center', 
        marginTop: 50, 
        color: CORES.cinza, 
        fontSize: TAMANHOS.fontSize.m,
        fontFamily: FONTE.regular,
    },
});