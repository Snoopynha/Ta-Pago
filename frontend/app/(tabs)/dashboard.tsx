import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../../src/api/api';
import { useFocusEffect } from 'expo-router';
import { CORES, FONTE, TAMANHOS } from '@/src/styles/tema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ICONES_CATEGORIA } from './contas';

// Tipagem
type DadosDashboard = {
    nome_residencia: string | null;
    total_pago_mes_atual: string;
    resumo_status: {
        pendente: { quantidade: number; total: string };
        atrasado: { quantidade: number; total: string };
        pago: { quantidade: number; total: string };
    };
    gastos_por_categoria: Array<{ categoria: string; total: string }>;
};

type DadosMensal = { gastos_por_mes: Array<{ periodo: string; total: string }>; };

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
function formatarPeriodo(periodo: string): string {
    const [ano, mes] = periodo.split('-');
    return `${MESES[parseInt(mes) - 1]} ${ano}`;
}

export function formatarMoeda(valor: string | number): string {
    return Number(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export default function Dashboard() {
    const [dados, setDados] = useState<DadosDashboard | null>(null);
    const [mensal, setMensal] = useState<DadosMensal | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);

     const carregarDados = async (silencioso = false) => {
        if (!silencioso) setCarregando(true);
        else setAtualizando(true);

        try {
            const [resDash, resMensal] = await Promise.all([
                api.get('/contas/dashboard'),
                api.get('/contas/dashboard/mensal', { params: { meses: 6 } }),
            ]);
            setDados(resDash.data);
            setMensal(resMensal.data);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            carregarDados();
        }, [])
    );

    if (carregando) {
        return (
            <View style={styles.centro}>
                <ActivityIndicator size="large" color={CORES.verdeprincipal}/>
            </View>
        );
    }

    const totalCategorias = dados?.gastos_por_categoria?.reduce(
        (acc, item) => acc + Number(item.total), 0
    ) || 0;

    const pendente = dados?.resumo_status?.pendente;
    const atrasado = dados?.resumo_status?.atrasado;
    
    return (
        <ScrollView style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={atualizando}
                    onRefresh={() => carregarDados(true)}
                    colors={[CORES.verdeprincipal]}
                    tintColor={CORES.verdeprincipal}
                />
            }
        >
            <View style={styles.header}>
                <Text style={styles.nomeResidencia}>{dados?.nome_residencia || 'Minha Residência'}</Text>
                <Text style={styles.labelTotal}>Pago este mês</Text>
                <Text style={styles.valorTotal}>R$ {formatarMoeda(dados?.total_pago_mes_atual || '0')}</Text>
            </View>

            <View style={styles.corpo}>
                {(Number(atrasado?.quantidade) > 0 || Number(pendente?.quantidade) > 0) && (
                    <View style={styles.alertasRow}>
                        {Number(atrasado?.quantidade) > 0 && (
                            <View style={[styles.alertaCard, { borderColor: CORES.vermelho + '50', backgroundColor: CORES.vermelho + '0D' }]}>
                                <MaterialCommunityIcons name="alert-circle" size={20} color={CORES.vermelho}/>
                                <View>
                                    <Text style={[styles.alertaQtd, { color: CORES.vermelho }]}>{atrasado?.quantidade} em atraso</Text>
                                    <Text style={styles.alertaValor}>R$ {formatarMoeda(atrasado?.total || '0')}</Text>
                                </View>
                            </View>
                        )}
                        {Number(pendente?.quantidade) > 0 && (
                            <View style={[styles.alertaCard, { borderColor: CORES.laranja + '50', backgroundColor: CORES.laranja + '0D' }]}>
                                <MaterialCommunityIcons name="clock-outline" size={20} color={CORES.laranja} />
                                <View>
                                    <Text style={[styles.alertaQtd, { color: CORES.laranja }]}>
                                        {pendente?.quantidade} pendente{Number(pendente?.quantidade) > 1 ? 's' : ''}
                                    </Text>
                                    <Text style={styles.alertaValor}>R$ {formatarMoeda(pendente?.total || '0')}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {dados?.gastos_por_categoria && dados.gastos_por_categoria.length > 0 && (
                    <View style={styles.secao}>
                        <Text style={styles.secaoTitulo}>Gastos por categoria</Text>
                        {dados.gastos_por_categoria
                            .sort((a, b) => Number(b.total) - Number(a.total))
                            .map((item) => {
                                const pct = totalCategorias > 0
                                    ? (Number(item.total) / totalCategorias) * 100
                                    : 0;
                                const icone = ICONES_CATEGORIA[item.categoria] || 'tag';

                                return (
                                    <View key={item.categoria} style={styles.categoriaItem}>
                                        <View style={styles.categoriaHeader}>
                                            <View style={styles.categoriaLabel}>
                                                <MaterialCommunityIcons name={icone as any} size={16} color={CORES.verdeprincipal}/>
                                                <Text style={styles.categoriaNome}>
                                                    {item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)}
                                                </Text>
                                            </View>
                                            <Text style={styles.categoriaValor}>R$ {formatarMoeda(item.total)}</Text>
                                        </View>
                                        <View style={styles.barraFundo}>
                                            <View style={[ styles.barraPreenchida, { width: `${Math.min(pct, 100)}%` as any }]}/>
                                        </View>
                                    </View>
                                );
                            })}
                    </View>
                )}

                {mensal?.gastos_por_mes && mensal.gastos_por_mes.length > 0 && (
                    <View style={styles.secao}>
                        <Text style={styles.secaoTitulo}>Últimos 6 meses</Text>
                        {(() => {
                            const maxValor = Math.max(
                                ...mensal.gastos_por_mes.map(m => Number(m.total))
                            );
                            return (
                                <View style={styles.graficoColunas}>
                                    {mensal.gastos_por_mes.map((mes) => {
                                        const altura = maxValor > 0
                                            ? (Number(mes.total) / maxValor) * 80
                                            : 0;
                                        return (
                                            <View key={mes.periodo} style={styles.colunaItem}>
                                                <Text style={styles.colunaValor}>
                                                    {Number(mes.total) >= 1000
                                                        ? `${(Number(mes.total)/1000).toFixed(1)}k`
                                                        : formatarMoeda(mes.total)
                                                    }
                                                </Text>
                                                <View style={styles.colunaBarraFundo}>
                                                    <View style={[ styles.colunaBarraPreenchida, { height: Math.max(altura, 4) }]}/>
                                                </View>
                                                <Text style={styles.colunaMes}>{formatarPeriodo(mes.periodo).split(' ')[0]}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            );
                        })()}
                    </View>
                )}

                {!dados?.gastos_por_categoria?.length && !carregando && (
                    <View style={styles.vazio}>
                        <MaterialCommunityIcons name="home-outline" size={48} color={CORES.borda}/>
                        <Text style={styles.vazioTitulo}>Tudo limpo por aqui!</Text>
                        <Text style={styles.vazioDescricao}>Adicione contas na aba "Contas" para ver o resumo aqui.</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CORES.fundoapp },
    centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        backgroundColor: CORES.verdeprincipal,
        paddingTop: 30,
        paddingBottom: 40,
        paddingHorizontal: TAMANHOS.padding,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    nomeResidencia: {
        fontFamily: FONTE.regular,
        fontSize: TAMANHOS.fontSize.p,
        color: CORES.branco + 'CC',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    labelTotal: { fontFamily: FONTE.regular, fontSize: TAMANHOS.fontSize.m, color: CORES.branco + 'BB' },
    valorTotal: {
        fontFamily: FONTE.bold,
        fontSize: 38,
        color: CORES.branco,
        marginTop: 4,
    },
    corpo: { padding: TAMANHOS.padding, gap: 20, marginTop: -16 },
    alertasRow: { flexDirection: 'row', gap: 12 },
    alertaCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: TAMANHOS.borderRadiusLarge,
        borderWidth: 1,
        backgroundColor: CORES.branco,
    },
    alertaQtd: { fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.p },
    alertaValor: {
        fontFamily: FONTE.regular,
        fontSize: TAMANHOS.fontSize.p,
        color: CORES.cinza,
        marginTop: 1,
    },
    secao: {
        backgroundColor: CORES.branco,
        borderRadius: TAMANHOS.borderRadiusLarge,
        padding: TAMANHOS.padding,
        gap: 14,
        elevation: 1,
        shadowColor: CORES.preto,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
    },
    secaoTitulo: { fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m, color: CORES.preto },
    categoriaItem: { gap: 6 },
    categoriaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    categoriaLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    categoriaNome: { fontFamily: FONTE.regular, fontSize: TAMANHOS.fontSize.m, color: CORES.preto },
    categoriaValor: { fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m, color: CORES.preto },
    barraFundo: {
        height: 6,
        backgroundColor: CORES.borda,
        borderRadius: 3,
        overflow: 'hidden',
    },
    barraPreenchida: { height: 6, backgroundColor: CORES.verdeprincipal, borderRadius: 3 },
    // Gráfico de colunas mensais
    graficoColunas: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 120,
        paddingTop: 24,
    },
    colunaItem: { flex: 1, alignItems: 'center', gap: 4 },
    colunaValor: { fontFamily: FONTE.regular, fontSize: 9, color: CORES.cinzaclaro },
    colunaBarraFundo: {
        width: '70%',
        height: 80,
        backgroundColor: CORES.borda,
        borderRadius: 4,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    colunaBarraPreenchida: { width: '100%', backgroundColor: CORES.verdeprincipal + 'CC', borderRadius: 4 },
    colunaMes: { fontFamily: FONTE.regular, fontSize: 10, color: CORES.cinza },
    vazio: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    vazioTitulo: { fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.g, color: CORES.cinza },
    vazioDescricao: {
        fontFamily: FONTE.regular,
        fontSize: TAMANHOS.fontSize.m,
        color: CORES.cinzaclaro,
        textAlign: 'center',
        lineHeight: 22,
    },
});