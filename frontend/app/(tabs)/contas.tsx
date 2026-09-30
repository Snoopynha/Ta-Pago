import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput, ScrollView } from 'react-native';
import api from '../../src/api/api';

export default function Contas() {
    const [contas, setContas] = useState([]);
    const [modalVisivel, setModalVisivel] = useState(false);
    const [nome, setNome] = useState('');
    const [valor, setValor] = useState('');
    const [vencimento, setVencimento] = useState('');
    const [categoria, setCategoria] = useState('outros');
    const [frequencia, setFrequencia] = useState('mensal');
    const [observacao, setObservacao] = useState('');
    const categoriasDisponiveis = ["agua", "luz", "internet", "aluguel", "gas", "condominio", "streaming", "telefone", "outros"];
    const frequenciasDisponiveis = ["unica", "mensal", "semanal", "anual"];

    const carregarContas = async () => {
        try {
            const resposta = await api.get('/contas');
            setContas(resposta.data);
        } catch (erro) {
            console.error("Erro ao carregar as contas: ", erro);
        }
    };

    useEffect(() => {
        carregarContas();
    }, []);

    const pagarConta = async (id: number) => {
        try {
            await api.post(`/contas/${id}/pagar`, {});
            Alert.alert("Sucesso", "Conta marcada como paga!");
            carregarContas();
        } catch (erro: any) {
            Alert.alert("Erro", erro.response?.data?.msg || "Não foi possível registar o pagamento.");
        }
    }

    const criarNovaConta = async () => {
        if (!nome || !valor || !vencimento) {
            Alert.alert("Atenção", "Preencha Nome, Valor e Vencimento!");
            return;
        }

        try {
            await api.post('/contas', {
                nome: nome,
                valor: parseFloat(valor.replace(',', '.')),
                vencimento: vencimento,
                categoria: categoria,
                frequencia: frequencia,
                observacao: observacao
            });

            Alert.alert("Sucesso", "Conta criada com sucesso!");

            setNome(''); setValor(''); setVencimento(''); setCategoria('outros'); setObservacao('');
            setModalVisivel(false);
            carregarContas();
        } catch (erro: any) {
            Alert.alert("Erro", erro.response?.data?.erro || "Falha ao criar conta. Verifique a data (AAAA-MM-DD).");
        }
    };

    const renderItem = ({ item }: any) => {
        const corStatus = item.status === 'atrasado' ? '#EF4444' : item.status === 'pago' ? '#10B981' : '#F59E0B';

        return (
            <View style={[styles.cardConta, { borderLeftColor: corStatus }]}>
                <View style={styles.infoConta}>
                    <Text style={styles.nomeConta}>{item.nome}</Text>
                    <Text style={styles.detalhes}>Vence: {item.vencimento.split('-').reverse().join('/')}</Text>
                    <Text style={styles.valor}>R$ {item.valor}</Text>
                    <Text style={[styles.status, { color: corStatus }]}>{item.status.toUpperCase()}</Text>
                </View>

                {item.status !== 'pago' && (
                    <TouchableOpacity style={styles.botaoPagar} onPress={() => pagarConta(item.id)}>
                        <Text style={styles.textoBotao}>Pagar</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={contas}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            />

            <Modal visible={modalVisivel} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nova Conta</Text>

                        <TextInput style={styles.input} placeholder="Nome (Ex: Netflix)" value={nome} onChangeText={setNome} />

                        <View style={styles.row}>
                            <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} placeholder="Valor (Ex: 45.90)" keyboardType="numeric" value={valor} onChangeText={setValor} />
                            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Data: AAAA-MM-DD" value={vencimento} onChangeText={setVencimento} />
                        </View>

                        <Text style={styles.label}>Categoria:</Text>
                        <View style={styles.chipContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {categoriasDisponiveis.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.chip, categoria === cat && styles.chipSelecionado]}
                                        onPress={() => setCategoria(cat)}
                                    >
                                        <Text style={[styles.chipText, categoria === cat && styles.chipTextSelecionado]}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <Text style={styles.label}>Frequência:</Text>
                        <View style={styles.chipContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {frequenciasDisponiveis.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.chip, categoria === cat && styles.chipSelecionado]}
                                        onPress={() => setCategoria(cat)}
                                    >
                                        <Text style={[styles.chipText, categoria === cat && styles.chipTextSelecionado]}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <TextInput style={styles.input} placeholder="Observação (Opcional)" value={observacao} onChangeText={setObservacao} />

                        <TouchableOpacity style={styles.botaoSalvar} onPress={criarNovaConta}>
                            <Text style={styles.textoBotao}>Salvar Conta</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.botaoCancelar} onPress={() => setModalVisivel(false)}>
                            <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisivel(true)}>
                <Text style={styles.fabText}>+ Nova</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    cardConta: { backgroundColor: '#FFF', borderRadius: 8, padding: 15, marginBottom: 15, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 5 },
    infoConta: { flex: 1 },
    nomeConta: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    detalhes: { fontSize: 14, color: '#6B7280', marginTop: 2 },
    valor: { fontSize: 16, fontWeight: 'bold', color: '#0D9488', marginTop: 4 },
    status: { fontSize: 12, fontWeight: 'bold', marginTop: 4 },
    botaoPagar: { backgroundColor: '#0D9488', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    textoBotao: { color: '#FFF', fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#0D9488', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 30, elevation: 5 },
    fabText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#FFF', padding: 25, borderRadius: 10, width: '90%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0D9488', marginBottom: 15 },
    input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 14, color: '#4B5563', marginBottom: 8, fontWeight: 'bold' },
    chipContainer: { marginBottom: 15, flexDirection: 'row' },
    chip: { backgroundColor: '#E5E7EB', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 10 },
    chipSelecionado: { backgroundColor: '#0D9488' },
    chipText: { color: '#4B5563', fontSize: 14 },
    chipTextSelecionado: { color: '#FFF', fontWeight: 'bold' },
    botaoSalvar: { backgroundColor: '#0D9488', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10, marginTop: 5 },
    botaoCancelar: { padding: 15, alignItems: 'center' },
    textoBotaoCancelar: { color: '#EF4444', fontWeight: 'bold' }
});