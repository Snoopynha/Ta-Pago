import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import api from '../../src/api/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CORES, FONTE, TAMANHOS } from '@/src/styles/tema';

// Tipagem
type Fatura = {
    id: number;
    conta_id: number;
    conta_nome: string;
    conta_categoria: string;
    vencimento: string;
    valor: number;
    status: 'pendente' | 'pago' | 'atrasado';
    observacao?: string;
};

export const ICONES_CATEGORIA: Record<string, string> = {
    agua: 'water',
    luz: 'lightning-bolt',
    internet: 'wifi',
    aluguel: 'home',
    gas: 'fire',
    condominio: 'office-building',
    streaming: 'play-circle',
    telefone: 'cellphone',
    outros: 'tag',
};

const COR_STATUS: Record<string, string> = {
    atrasado: CORES.vermelho,
    pago: CORES.verde,
    pendente: CORES.laranja,
};

export default function Contas() {
    const [faturas, setFaturas] = useState<Fatura[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [modalVisivel, setModalVisivel] = useState(false);
    // Infos formulário
    const [nome, setNome] = useState('');
    const [valorBase, setValorBase] = useState('');
    const [categoria, setCategoria] = useState('outros');
    const [frequencia, setFrequencia] = useState('mensal');
    const [diaVencimento, setDiaVencimento] = useState('');
    const [observacao, setObservacao] = useState('');
    const CATEGORIAS = ["agua", "luz", "internet", "aluguel", "gas", "condominio", "streaming", "telefone", "outros"];
    const FREQUENCIAS = ["unica", "mensal", "anual"];

    const carregarFaturas = async () => {
        try {
            setCarregando(true);
            const resposta = await api.get('/contas/faturas');
            setFaturas(resposta.data.faturas);
        } catch (error) {
            console.error("Erro ao carregar as faturas: ", error);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarFaturas();
    }, []);

    const pagarFatura = async (fatura: Fatura) => {
        Alert.alert(
            "Confirmar pagamento", `Pagar ${fatura.conta_nome} - R$ ${Number(fatura.valor).toFixed(2)}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Confirmar",
                    onPress: async () => {
                        try {
                            await api.post(`/contas/faturas/${fatura.id}/pagar`, {valor_pago: fatura.valor});
                            Alert.alert("Pago!", "Pagamento registrado com sucesso.");
                            carregarFaturas();
                        } catch (error: any) {
                            console.log(error.response?.data);
                            Alert.alert("Erro", error.response?.data?.msg || "Não foi possível registar o pagamento.");
                        }
                    }
                }
            ]
        );
    };

    const criarNovaConta = async () => {
        if (!nome || !valorBase) {
            Alert.alert("Atenção", "Nome e o valor são obrigatórios.");
            return;
        }

        try {
            await api.post('/contas/', {
                nome,
                categoria,
                frequencia,
                valor_base: parseFloat(valorBase.replace(',', '.')),
                dia_vencimento: diaVencimento ? parseInt(diaVencimento) : null,
                observacao: observacao || null,
                gerar_primeira: true,
            });

            Alert.alert("Criada!", "Conta criada e primeira fatura gerada.");
            limparFormulario()
            setModalVisivel(false);
            carregarFaturas();
        } catch (error: any) {
            console.log(error.response?.data);
            Alert.alert("Erro", error.response?.data?.erro || "Falha ao criar conta.");
        }
    };

    const limparFormulario = () => {
        setNome('');
        setValorBase('');
        setDiaVencimento('');
        setCategoria('outros');
        setFrequencia('mensal');
        setObservacao('');
    };

    const formatarData = (dataStr: string) => {
        return dataStr.split('-').reverse().join('/');
    };

    const renderFatura = ({ item }: { item: Fatura }) => {
        const corStatus = COR_STATUS[item.status] || CORES.cinza;
        const icone = ICONES_CATEGORIA[item.conta_categoria] || 'tag';

        return (
            <View style={[styles.cardFatura, { borderLeftColor: corStatus }]}>
                <View style={[styles.iconeCat, { backgroundColor: corStatus + '20'}]}>
                    <MaterialCommunityIcons name={icone as any} size={22} color={corStatus}/>
                </View>

                <View style={[styles.infoFatura]}>
                    <Text style={styles.nomeFatura}>{item.conta_nome}</Text>
                    <Text style={styles.detalhesFatura}>Vence: {formatarData(item.vencimento)}</Text>
                    <View style={styles.linhaInferior}>
                        <Text style={styles.valorFatura}>R$ {Number(item.valor).toFixed(2)}</Text>
                        <View style={[styles.badgeStatus, { backgroundColor: corStatus + '20' }]}>
                            <Text style={[styles.textoStatus, {color: corStatus}]}>{item.status.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
                {item.status !== 'pago' && (
                    <TouchableOpacity style={styles.botaoPagar} onPress={() => pagarFatura(item)}>
                        <MaterialCommunityIcons name="check" size={20} color={CORES.branco}/>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {carregando ? (
                <View style={styles.centro}>
                    <ActivityIndicator size="large" color={CORES.verdeprincipal} />
                </View>
            ) : (
                <FlatList
                    data={faturas}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderFatura}
                    contentContainerStyle={{ padding: TAMANHOS.padding, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <Text style={styles.vazio}>Nenhuma fatura encontrada.</Text>
                    }
                />
            )}

            <Modal visible={modalVisivel} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitulo}>Nova Conta</Text>

                        <TextInput style={styles.input} placeholder="Ex: Netflix" value={nome} onChangeText={setNome} />
                        <TextInput style={styles.input} placeholder="Valor base (Ex: 45.90)" keyboardType="numeric" value={valorBase} onChangeText={setValorBase}/>

                        {frequencia === 'mensal' && (
                            <TextInput style={styles.input} placeholder="Dia de vencimento (1–31)" keyboardType="numeric" value={diaVencimento} onChangeText={setDiaVencimento} maxLength={2}/>
                        )}

                        <Text style={styles.label}>Frequência:</Text>
                        <View style={styles.chipContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {FREQUENCIAS.map((freq) => (
                                    <TouchableOpacity
                                        key={freq}
                                        style={[styles.chip, frequencia === freq && styles.chipSelecionado]}
                                        onPress={() => setFrequencia(freq)}
                                    >
                                        <Text style={[styles.chipTexto, frequencia === freq && styles.chipTextoSelecionado]}>
                                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <Text style={styles.label}>Categoria:</Text>
                        <View style={styles.chipContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {CATEGORIAS.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.chip, categoria === cat && styles.chipSelecionado]}
                                        onPress={() => setCategoria(cat)}
                                    >
                                        <Text style={[styles.chipTexto, categoria === cat && styles.chipTextoSelecionado]}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <TextInput style={styles.input} placeholder="Observação (Opcional)" value={observacao} onChangeText={setObservacao}/>
                        
                        <TouchableOpacity style={styles.botaoSalvar} onPress={criarNovaConta}>
                            <Text style={styles.textoBotaoBranco}>Salvar Conta</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.botaoCancelar} onPress={() => { limparFormulario(); setModalVisivel(false);}}>
                            <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisivel(true)}>
                <MaterialCommunityIcons name="plus" size={24} color={CORES.branco}/>
                <Text style={styles.fabTexto}>Nova</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CORES.fundoapp },
    centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    vazio: {
        textAlign: 'center',
        marginTop: 50,
        color: CORES.cinza,
        fontSize: TAMANHOS.fontSize.m,
    },
    cardFatura: {
        backgroundColor: CORES.branco,
        borderRadius: TAMANHOS.borderRadius,
        padding: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        elevation: 2,
        shadowColor: CORES.preto,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderLeftWidth: 4,
    },
    iconeCat: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoFatura: { flex: 1 },
    nomeFatura: { fontSize: TAMANHOS.fontSize.m, fontFamily: FONTE.bold, color: CORES.preto },
    detalhesFatura: {
        fontSize: TAMANHOS.fontSize.p,
        fontFamily: FONTE.regular,
        color: CORES.cinza,
        marginTop: 2,
    },
    linhaInferior: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    valorFatura: { fontSize: TAMANHOS.fontSize.m, fontFamily: FONTE.bold, color: CORES.preto },
    badgeStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    textoStatus: { fontSize: 10, fontFamily: FONTE.bold },
    botaoPagar: {
        backgroundColor: CORES.verdeprincipal,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: CORES.branco,
        padding: TAMANHOS.padding,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
    },
    modalTitulo: {
        fontSize: TAMANHOS.fontSize.g,
        fontFamily: FONTE.bold,
        color: CORES.verdeprincipal,
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: CORES.borda,
        borderRadius: TAMANHOS.borderRadius,
        padding: 12,
        marginBottom: 12,
        fontFamily: FONTE.regular,
        fontSize: TAMANHOS.fontSize.m,
    },
    label: {
        fontSize: TAMANHOS.fontSize.p,
        fontFamily: FONTE.bold,
        color: CORES.cinza,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chipContainer: { marginBottom: 12, flexDirection: 'row' },
    chip: {
        backgroundColor: CORES.fundoapp,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: CORES.borda,
    },
    chipSelecionado: { backgroundColor: CORES.verdeprincipal, borderColor: CORES.verdeprincipal },
    chipTexto: { fontFamily: FONTE.regular, fontSize: TAMANHOS.fontSize.p, color: CORES.cinza },
    chipTextoSelecionado: { fontFamily: FONTE.bold, color: CORES.branco },
    botaoSalvar: {
        backgroundColor: CORES.verdeprincipal,
        padding: 15,
        borderRadius: TAMANHOS.borderRadius,
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 10,
    },
    textoBotaoBranco: { color: CORES.branco, fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m },
    botaoCancelar: { padding: 12, alignItems: 'center' },
    textoBotaoCancelar: { color: CORES.vermelho, fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: CORES.verdeprincipal,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 30,
        gap: 6,
        elevation: 5,
        shadowColor: CORES.preto,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    fabTexto: { color: CORES.branco, fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m },
});