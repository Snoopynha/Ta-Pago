import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Switch, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CORES, FONTE, TAMANHOS } from '@/src/styles/tema';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Cadastro() {
    const router = useRouter();
    // Controla o estado que está
    const [etapa, setEtapa] = useState<1 | 2>(1);
    const [carregando, setCarregando] = useState(false);
    // Dados do usuário, etapa 1
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    // Dados da residência, etapa 2
    const [temCodigo, setTemCodigo] = useState(false);
    const [nomeResidencia, setNomeResidencia] = useState('');
    const [codigoConvite, setCodigoConvite] = useState('');

    const [tokenTemp, setTokenTemp] = useState('');

    // Registra o usuário e faz login
    const handleEtapa1 = async () => {
        if (!nome || !email || !senha) {
            Alert.alert("Atenção", "Você precisa preencher todos os campos.")
            return;
        }

        setCarregando(true);
        try {
            await api.post('/registrar', {nome, email, senha});
            
            // Faz login por conta da residência
            const loginResp = await api.post('/logar', {email,senha});
            const {token} = loginResp.data;

            await AsyncStorage.setItem('@HomeFinance:token', token);
            setTokenTemp(token);
            setEtapa(2);
        } catch (error: any) {
            console.log(error.response?.data);
            Alert.alert("Erro ao cadastrar", error.response?.data?.msg || "Verifique os dados e tente novamente.");
        } finally {
            setCarregando(false);
        }
    };

    const handleEtapa2 = async () => {
        setCarregando(true);
        try {
            if (temCodigo) {
                if (!codigoConvite) {
                    Alert.alert("Atenção", "Informe o código de convite.");
                    return;
                }
                await api.post('/residencia/entrar', {codigo_convite: codigoConvite});
            } else {
                if (!nomeResidencia) {
                    Alert.alert("Atenção", "Informe o nome da residência.");
                    return;
                }
                await api.post('/residencia/', {nome: nomeResidencia});
            }

            const perfilResp = await api.get('/eu');
            await AsyncStorage.setItem('@HomeFinance:user', JSON.stringify(perfilResp.data));

            Alert.alert("Bem vindo!", "Conta e residência configuradas com sucesso.", 
                [{ text: "Entrar", onPress: () => router.replace('/(tabs)/dashboard')}]
            );
        } catch (error: any) {
            console.log(error.response?.data);
            Alert.alert("Erro", error.response?.data?.msg || "Erro ao configurar a residência.");
        } finally {
            setCarregando(false);
        }
    };

    // Barra de progresso
    const renderProgresso = () => (
        <View style={styles.progressoContainer}>
            <View style={[styles.progressoPasso, etapa >= 1 && styles.progressoAtivo]}>
                <Text style={[styles.progressoNumero, etapa >= 1 && styles.progressoNumeroAtivo]}>1</Text>
            </View>
            <View style={[styles.progressoLinha, etapa >= 2 && styles.progressoLinhaAtiva]}/>
            <View style={[styles.progressoPasso, etapa >= 2 && styles.progressoAtivo]}>
                <Text style={[styles.progressoNumero, etapa >= 2 && styles.progressoNumeroAtivo]}>2</Text>
            </View>
        </View>
    );

    // Aparição teclado
    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Text style={styles.logo}>Ta Pago</Text>
                <Text style={styles.subtitulo}>Criar conta</Text>
                
                {renderProgresso()}
                {etapa === 1 && (
                    <View style={styles.formulario}>
                        <Text style={styles.tituloEtapa}>Seus dados</Text>

                        <View style={styles.campoContainer}>
                            <Text style={styles.label}>Nome completo</Text>
                            <TextInput style={styles.input} placeholder="Ex: Paola Bracho" value={nome} onChangeText={setNome} autoCapitalize="words"/>
                        </View>
                        <View style={styles.campoContainer}>
                            <Text style={styles.label}>E-mail</Text>
                            <TextInput style={styles.input} placeholder="paola@email.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>
                        </View>
                        <View style={styles.campoContainer}>
                            <Text style={styles.label}>Senha</Text>
                            <TextInput style={styles.input} placeholder="senha123" value={senha} onChangeText={setSenha} secureTextEntry/>
                        </View>

                        <TouchableOpacity style={[styles.botao, carregando && styles.botaoDesabilitado]} onPress={handleEtapa1} disabled={carregando}>
                            {carregando ? (
                                <ActivityIndicator color={CORES.branco}/>
                            ) : (
                                <>
                                <Text style={styles.textoBotao}>Continuar</Text>
                                <MaterialCommunityIcons name="arrow-right" size={20} color={CORES.branco}/>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
                {etapa === 2 && (
                    <View style={styles.formulario}>
                        <Text style={styles.tituloEtapa}>Sua residência</Text>
                        <Text style={styles.descricaoEtapa}>Você vai gerenciar contas junto com quem mora na mesma casa.</Text>

                        <View style={styles.switchContainer}>
                            <Text style={styles.switchTexto}>Já tenho um código de convite</Text>
                            <Switch
                                value={temCodigo}
                                onValueChange={setTemCodigo}
                                trackColor={{ false: CORES.borda, true: CORES.verdeclaro }}
                                thumbColor={temCodigo ? CORES.verdeprincipal : CORES.cinzaclaro}
                            />
                        </View>

                        {temCodigo ? (
                            <View style={styles.campoContainer}>
                                <Text style={styles.label}>Código de convite</Text>
                                <TextInput
                                    style={[styles.input, styles.inputCodigo]}
                                    placeholder="ABC123"
                                    value={codigoConvite}
                                    onChangeText={setCodigoConvite}
                                    autoCapitalize="characters"
                                    maxLength={6}
                                />
                            </View>
                        ) : (
                            <View style={styles.campoContainer}>
                                <Text style={styles.label}>Nome da residência</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: Casa dos Estudantes"
                                    value={nomeResidencia}
                                    onChangeText={setNomeResidencia}
                                />
                            </View>
                        )}

                        <TouchableOpacity style={[styles.botao, carregando && styles.botaoDesabilitado]} onPress={handleEtapa2} disabled={carregando}>
                            {carregando ? (
                                <ActivityIndicator color={CORES.branco}/>
                            ) : (
                                <Text style={styles.textoBotao}>{temCodigo ? "Entrar na residência" : "Criar residência"}</Text>
                            )}
                        </TouchableOpacity>

                        {/* Volta para a etapa 1 */}
                        <TouchableOpacity style={styles.botaoVoltar} onPress={() => setEtapa(1)}>
                            <MaterialCommunityIcons name="arrow-left" size={16} color={CORES.cinza}/>
                            <Text style={styles.textoVoltar}>Voltar e editar dados</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity onPress={() => router.replace('/')}>
                    <Text style={styles.linkLogin}>Já tem conta? Fazer login</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CORES.fundoapp },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: TAMANHOS.padding },
    logo: {
        fontSize: TAMANHOS.fontSize.xxg,
        fontFamily: FONTE.logo,
        color: CORES.verdeprincipal,
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitulo: {
        fontSize: TAMANHOS.fontSize.m,
        fontFamily: FONTE.regular,
        color: CORES.cinza,
        textAlign: 'center',
        marginBottom: 24,
    },
    progressoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    progressoPasso: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: CORES.borda,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressoAtivo: { backgroundColor: CORES.verdeprincipal },
    progressoNumero: { fontSize: TAMANHOS.fontSize.m, fontFamily: FONTE.bold, color: CORES.cinza },
    progressoNumeroAtivo: { color: CORES.branco },
    progressoLinha: {
        flex: 1,
        height: 2,
        backgroundColor: CORES.borda,
        marginHorizontal: 8,
        maxWidth: 60,
    },
    progressoLinhaAtiva: { backgroundColor: CORES.verdeprincipal },

    // Formulário
    formulario: {
        backgroundColor: CORES.branco,
        borderRadius: TAMANHOS.borderRadiusLarge,
        padding: TAMANHOS.padding,
        marginBottom: 16,
        elevation: 2,
        shadowColor: CORES.preto,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tituloEtapa: {
        fontSize: TAMANHOS.fontSize.g,
        fontFamily: FONTE.bold,
        color: CORES.preto,
        marginBottom: 4,
    },
    descricaoEtapa: {
        fontSize: TAMANHOS.fontSize.p,
        fontFamily: FONTE.regular,
        color: CORES.cinza,
        marginBottom: 16,
        lineHeight: 18,
    },
    campoContainer: { marginBottom: 12 },
    label: {
        fontSize: TAMANHOS.fontSize.p,
        fontFamily: FONTE.bold,
        color: CORES.cinza,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: CORES.fundoapp,
        padding: 13,
        borderRadius: TAMANHOS.borderRadius,
        borderWidth: 1,
        borderColor: CORES.borda,
        fontFamily: FONTE.regular,
        fontSize: TAMANHOS.fontSize.m,
        color: CORES.preto,
    },
    inputCodigo: {
        textAlign: 'center',
        fontSize: TAMANHOS.fontSize.g,
        fontFamily: FONTE.bold,
        letterSpacing: 4,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: CORES.borda,
    },
    switchTexto: {
        fontSize: TAMANHOS.fontSize.m,
        fontFamily: FONTE.regular,
        color: CORES.preto,
        flex: 1,
        marginRight: 12,
    },
    botao: {
        backgroundColor: CORES.verdeprincipal,
        padding: 15,
        borderRadius: TAMANHOS.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    botaoDesabilitado: { opacity: 0.7 },
    textoBotao: { color: CORES.branco, fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m },
    botaoVoltar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
        padding: 8,
    },
    textoVoltar: { color: CORES.cinza, fontFamily: FONTE.regular, fontSize: TAMANHOS.fontSize.p },
    linkLogin: {
        color: CORES.verdeprincipal,
        textAlign: 'center',
        fontFamily: FONTE.bold,
        fontSize: TAMANHOS.fontSize.m,
        marginTop: 8,
    },
});