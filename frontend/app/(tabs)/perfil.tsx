import React, { use, useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/contexts/AuthContext';
import * as Clipboard from 'expo-clipboard';
import { CORES, FONTE, TAMANHOS } from '@/src/styles/tema';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/src/api/api';

// Tipagem
type Membro = {
    id: number;
    nome: string;
    email: string;
};

function iniciais(nome: string): string {
    return nome.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');
}

const CORES_AVATAR = [ CORES.verdeprincipal, '#6366f1', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6'];

function corAvatar(nome: string): string {
    const idx = nome.charCodeAt(0) % CORES_AVATAR.length;
    return CORES_AVATAR[idx];
}

export default function Perfil() {
    const router = useRouter();
    const { user, signOut, updateUser } = useAuth();
    const [membros, setMembros] = useState<Membro[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [atualizando, setAtualizando] = useState(false);
    const [editando, setEditando] = useState(false);
    const [nomeEdit, setNomeEdit] = useState(user?.nome || '');
    const [emailEdit, setEmailEdit] = useState(user?.email || '');
    const [salvando, setSalvando] = useState(false);
    
    const codigoConvite = user?.residencia?.codigo_convite;
    const nomeResidencia = user?.residencia?.nome;

    const carregarMembros = async (silencioso = false) => {
        if (!user?.residencia_id) return;
        if (!silencioso) setCarregando(true);
        else setAtualizando(true);

        try {
            const resp = await api.get('/residencia/membros');
            setMembros(resp.data);
        } catch (e) {
            console.error('Erro ao carregar membros', e);
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            carregarMembros();
        }, [])
    );

    useEffect(() => {
        setNomeEdit(user?.nome || '');
        setEmailEdit(user?.email || '');
    }, [user]);

    const salvarPerfil = async () => {
        if (!nomeEdit.trim()) {
            Alert.alert('Atenção', 'O nome não pode ser vazio.');
            return;
        }
        
        setSalvando(true);
        try {
            const resp = await api.put('/eu', { nome: nomeEdit, email: emailEdit });
            updateUser?.(resp.data);
            await AsyncStorage.setItem('@HomeFinance:user', JSON.stringify(resp.data));
            setEditando(false);
            Alert.alert('Salvo!', 'Perfil atualizado com sucesso.');
        } catch (e: any) {
            console.error(e.response?.data);
            Alert.alert('Erro', e.response?.data?.msg || 'Não foi possível salvar.');
        } finally {
            setSalvando(false);
        }
    };

    const sairResidencia = () => {
        Alert.alert('Sair da residência', 'Você perderá acesso às contas desta residência. Tem certeza?', 
            [{ text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: async () => {
                    try {
                        await api.post('/residencia/sair');
                        const novoUser = { ...user, residencia: null, residencia_id: null };
                        updateUser(novoUser);
                        await AsyncStorage.setItem('@HomeFinance:user', JSON.stringify(novoUser));
                    } catch (e: any) {
                        console.error(e.response?.data);
                        Alert.alert('Erro', e.response?.data?.msg || 'Falha ao sair.');
                    }
                }}
            ]
        );
    };

    // Remove os dados do armazenamento local
    const handleLogout = async () => {
        await AsyncStorage.removeItem('@HomeFinance:token');
        await AsyncStorage.removeItem('@HomeFinance:user');
        router.replace('/');
    };

    const copiarCodigo = async () => {
        if (codigoConvite) {
            await Clipboard.setStringAsync(codigoConvite);
            Alert.alert("Código copiado!", "Compartilhe com outros moradores.")
        }
    };
    
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}
            refreshControl={
                <RefreshControl refreshing={atualizando}
                    onRefresh={() => carregarMembros(true)}
                    colors={[CORES.verdeprincipal]}
                    tintColor={CORES.verdeprincipal}
                />
            }
        >

            <View style={styles.card}>
                <View style={[styles.avatar, { backgroundColor: corAvatar(user?.nome || 'U') }]}>
                    <Text style={styles.avatarTexto}>{iniciais(user?.nome || 'U')}</Text>
                </View>

                {editando ? (
                    <View style={styles.edicaoContainer}>
                        <TextInput style={styles.inputEdicao} value={nomeEdit} onChangeText={setNomeEdit} placeholder="Seu nome"/>
                        <TextInput style={styles.inputEdicao}
                            value={emailEdit}
                            onChangeText={setEmailEdit}
                            placeholder="Seu e-mail"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <View style={styles.botoesEdicao}>
                            <TouchableOpacity style={styles.botaoCancelarEdit} onPress={() => setEditando(false)}>
                                <Text style={styles.textoCancelarEdit}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.botaoSalvarEdit} onPress={salvarPerfil} disabled={salvando}>
                                {salvando ? 
                                    <ActivityIndicator size="small" color={CORES.branco}/> 
                                    : 
                                    <Text style={styles.textoSalvarEdit}>Salvar</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <>
                    <Text style={styles.nome}>{user?.nome}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <TouchableOpacity style={styles.botaoEditar} onPress={() => setEditando(true)}>
                        <MaterialCommunityIcons name="pencil-outline" size={14} color={CORES.verdeprincipal}/>
                        <Text style={styles.textoEditar}>Editar perfil</Text>
                    </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Card da residência caso a pessoa tenha*/}
            {nomeResidencia ? (
                <View style={styles.card}>
                    <View style={styles.cardTituloRow}>
                        <Text style={styles.cardTitulo}>Residência</Text>
                        <TouchableOpacity onPress={sairResidencia}>
                            <Text style={styles.textoSair}>Sair</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.nomeResidencia}>{nomeResidencia}</Text>
                    
                    <Text style={styles.codigoLabel}>Código de convite</Text>
                    <TouchableOpacity style={styles.codigoContainer} onPress={copiarCodigo}>
                        <Text style={styles.codigoValor}>{codigoConvite}</Text>
                        <MaterialCommunityIcons name="content-copy" size={32} color={CORES.cinza}/>
                    </TouchableOpacity>
                    <Text style={styles.dica}>Toque para copiar e compartilhar</Text>

                    <Text style={styles.membrosLabel}>Moradores</Text>
                    {carregando ? (
                        <ActivityIndicator color={CORES.verdeprincipal} />
                    ) : (
                        <View style={styles.membrosLista}>
                            {membros.map((m) => (
                                <View key={m.id} style={styles.membroItem}>
                                    <View style={[styles.membroAvatar, { backgroundColor: corAvatar(m.nome) }]}>
                                        <Text style={styles.membroAvatarTexto}>{iniciais(m.nome)}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.membroNome}>
                                            {m.nome}
                                            {m.id === user?.id ? ' (você)' : ''}
                                        </Text>
                                        <Text style={styles.membroEmail}>{m.email}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            ) : (
                <View style={[styles.card, styles.semCasaCard]}>
                    <MaterialCommunityIcons name="home-off-outline" size={32} color={CORES.cinzaclaro}/>
                    <Text style={styles.semCasaTexto}>Você não está em uma residência</Text>
                    <TouchableOpacity style={styles.botaoEntrarCasa}>
                        <Text style={styles.textoEntrarCasa}>Entrar em uma residência</Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={styles.botaoSair} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={18} color={CORES.branco}/>
                <Text style={styles.textoBotaoSair}>Sair da Conta</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CORES.fundoapp },
    scroll: { padding: TAMANHOS.padding, gap: 16, paddingBottom: 40 },
    card: {
        backgroundColor: CORES.branco,
        padding: TAMANHOS.padding,
        borderRadius: TAMANHOS.borderRadiusLarge,
        elevation: 1,
        shadowColor: CORES.preto,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        gap: 10,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 4,
    },
    avatarTexto: { fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.g, color: CORES.branco },
    nome: { 
        fontSize: TAMANHOS.fontSize.g, 
        fontFamily: FONTE.bold, 
        color: CORES.preto, 
        textAlign: 'center',
    },
    email: {
        fontSize: TAMANHOS.fontSize.m,
        fontFamily: FONTE.regular,
        color: CORES.cinza,
        textAlign: 'center',
    },
    botaoEditar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 6,
    },
    textoEditar: { fontFamily: FONTE.regular, fontSize: TAMANHOS.fontSize.p, color: CORES.verdeprincipal },
    // Modo edição
    edicaoContainer: { gap: 10, width: '100%' },
    inputEdicao: {
        borderWidth: 1,
        borderColor: CORES.borda,
        borderRadius: TAMANHOS.borderRadius,
        padding: 12,
        fontFamily: FONTE.regular,
        fontSize: TAMANHOS.fontSize.m,
        color: CORES.preto,
        backgroundColor: CORES.fundoapp,
    },
    botoesEdicao: { flexDirection: 'row', gap: 10 },
    botaoCancelarEdit: {
        flex: 1,
        padding: 12,
        borderRadius: TAMANHOS.borderRadius,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: CORES.borda,
    },
    textoCancelarEdit: { fontFamily: FONTE.regular, fontSize: TAMANHOS.fontSize.m, color: CORES.cinza },
    botaoSalvarEdit: {
        flex: 1,
        padding: 12,
        borderRadius: TAMANHOS.borderRadius,
        alignItems: 'center',
        backgroundColor: CORES.verdeprincipal,
    },
    textoSalvarEdit: { fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m, color: CORES.branco },
    // Card
    cardTituloRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitulo: { fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m, color: CORES.preto },
    textoSair: { fontFamily: FONTE.regular, fontSize: TAMANHOS.fontSize.p, color: CORES.vermelho },
    nomeResidencia: { fontSize: TAMANHOS.fontSize.g, fontFamily: FONTE.bold, color: CORES.verdeprincipal },
    codigoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: CORES.fundoapp,
        padding: 12,
        borderRadius: TAMANHOS.borderRadius,
        borderWidth: 1.5,
        borderColor: CORES.verdeprincipal + '40',
        borderStyle: 'dashed',
    },
    codigoLabel: { fontSize: TAMANHOS.fontSize.p, fontFamily: FONTE.regular, color: CORES.cinza },
    codigoValor: {
        fontSize: TAMANHOS.fontSize.g,
        fontFamily: FONTE.bold,
        color: CORES.verdeprincipal,
        letterSpacing: 3,
    },
    dica: {
        fontSize: TAMANHOS.fontSize.p,
        fontFamily: FONTE.regular,
        color: CORES.cinzaclaro,
        marginTop: 6,
    },
    // Membros
    membrosLabel: {
        fontSize: TAMANHOS.fontSize.p,
        fontFamily: FONTE.bold,
        color: CORES.cinza,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 4,
    },
    membrosLista: { gap: 10 },
    membroItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    membroAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    membroAvatarTexto: { fontSize: TAMANHOS.fontSize.p, fontFamily: FONTE.bold, color: CORES.branco },
    membroNome: { fontSize: TAMANHOS.fontSize.m, fontFamily: FONTE.bold, color: CORES.preto },
    membroEmail: { fontSize: TAMANHOS.fontSize.p, fontFamily: FONTE.regular, color: CORES.cinzaclaro },
    semCasaCard: { alignItems: 'center', paddingVertical: 28 },
    semCasaTexto: {
        fontSize: TAMANHOS.fontSize.m,
        fontFamily: FONTE.regular,
        color: CORES.cinza,
        textAlign: 'center',
    },
    botaoEntrarCasa: {
        marginTop: 4,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: TAMANHOS.borderRadius,
        backgroundColor: CORES.verdeprincipal + '15',
    },
    textoEntrarCasa: { fontSize: TAMANHOS.fontSize.m, fontFamily: FONTE.bold, color: CORES.verdeprincipal },
    botaoSair: {
        flexDirection: 'row',
        backgroundColor: CORES.vermelho,
        padding: 15,
        borderRadius: TAMANHOS.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    textoBotaoSair: { color: CORES.branco, fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m },
});