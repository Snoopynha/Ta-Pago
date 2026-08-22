import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SectionList, RefreshControl } from 'react-native';
import api from '../../src/api/api';
import { CORES, FONTE, TAMANHOS } from '@/src/styles/tema';
import { useFocusEffect } from 'expo-router';
import { ICONES_CATEGORIA } from './contas';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatarMoeda } from './dashboard';

// Tipagem
type ItemHistorico = {
    id: number;
    nome_conta: string;
    valor_pago: number;
    data_pagamento: string;
    usuario: string;
    categoria_conta?: string;
};

type Secao = {
    titulo: string,
    total: number,
    data: ItemHistorico[];
};

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function agruparPorMes(itens: ItemHistorico[]): Secao[] {
    const agrupado = itens.reduce<Record<string, Secao>>((acc, item) => {
        const data = new Date(item.data_pagamento);
        const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;

        if (!acc[chave]) {
            acc[chave] = {
                titulo: `${MESES[data.getMonth()]} ${data.getFullYear()}`,
                total: 0,
                data: [],
            };
        }

        acc[chave].data.push(item);
        acc[chave].total += Number(item.valor_pago);
        return acc;
    }, {});

    return Object.entries(agrupado).sort(([a], [b]) => b.localeCompare(a)).map(([, secao]) => secao);
}

export default function Historico() {
    const [secoes, setSecoes] = useState<Secao[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);

    const carregarHistorico = async (silencioso = false) => {
        if (!silencioso) setCarregando(true);
        else setAtualizando(true);

        try {
            const resposta = await api.get('/historico/');
            const agrupado = agruparPorMes(resposta.data);
            setSecoes(agrupado);
        } catch (erro) {
            console.error('Erro ao carregar histórico:', erro);
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            carregarHistorico();
        }, [])
    );

    if (carregando) {
        return (
            <View style={styles.centro}>
                <ActivityIndicator size="large" color={CORES.verdeprincipal}/>
            </View>
        )
    }

    const renderItem = ({ item }: { item: ItemHistorico }) => {
        const dataFormatada = new Date(item.data_pagamento).toLocaleDateString('pt-BR');
        const icone = ICONES_CATEGORIA[item.categoria_conta || ''] || 'cash';

        return (
            <View style={styles.item}>
                <View style={styles.itemIcone}>
                    <MaterialCommunityIcons name={icone as any} size={18} color={CORES.verdeprincipal}/>
                </View>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemNome}>{item.nome_conta}</Text>
                    <Text style={styles.itemData}>{dataFormatada} · por {item.usuario}</Text>
                </View>
                <Text style={styles.itemValor}>R$ {formatarMoeda(Number(item.valor_pago))}</Text>
            </View>
        );
    };

    const renderCabecalho = ({ section }: { section: Secao }) => (
        <View style={styles.cabecalhoSecao}>
            <Text style={styles.cabecalhoTitulo}>{section.titulo}</Text>
            <Text style={styles.cabecalhoTotal}>R$ {formatarMoeda(section.total)}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <SectionList
                sections={secoes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                renderSectionHeader={renderCabecalho}
                ItemSeparatorComponent={() => <View style={styles.separador}/>}
                contentContainerStyle={{ padding: TAMANHOS.padding, paddingBottom: 30 }}
                refreshControl={
                    <RefreshControl refreshing={atualizando} onRefresh={() => carregarHistorico(true)} colors={[CORES.verdeprincipal]} tintColor={CORES.verdeprincipal}/>
                }
                ListEmptyComponent={
                    <View style={styles.vazio}>
                        <MaterialCommunityIcons name="history" size={48} color={CORES.borda}/>
                        <Text style={styles.vazioTexto}>Nenhum pagamento registrado ainda.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CORES.fundoapp },
    centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    cabecalhoSecao: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        marginTop: 8,
        marginBottom: 4,
    },
    cabecalhoTitulo: { fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m, color: CORES.preto },
    cabecalhoTotal: { fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m, color: CORES.verdeprincipal },
    item: {
        backgroundColor: CORES.branco,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: TAMANHOS.borderRadius,
    },
    itemIcone: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: CORES.verdeprincipal + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: { flex: 1 },
    itemNome: { fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m, color: CORES.preto },
    itemData: {
        fontFamily: FONTE.regular,
        fontSize: TAMANHOS.fontSize.p,
        color: CORES.cinzaclaro,
        marginTop: 2,
    },
    itemValor: { fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m, color: CORES.verde },
    separador: { height: 6 },
    vazio: { alignItems: 'center', paddingTop: 80, gap: 12 },
    vazioTexto: { fontFamily: FONTE.regular, fontSize: TAMANHOS.fontSize.m, color: CORES.cinza },
});