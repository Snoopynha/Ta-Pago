import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/contexts/AuthContext';
import * as Clipboard from 'expo-clipboard';
import { CORES, FONTE, TAMANHOS } from '@/src/styles/tema';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Perfil() {
    const router = useRouter();
    const { user } = useAuth();
    const codigoConvite = user?.residencia?.codigo_convite;
    const nomeResidencia = user?.residencia?.nome;

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
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.avatar}>
                    <MaterialCommunityIcons name="account" size={40} color={CORES.branco} />
                </View>

                <Text style={styles.nome}>{user?.nome || 'Usuário'}</Text>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            {/* Card da residência caso a pessoa tenha*/}
            {nomeResidencia ? (
                <View style={styles.card}>
                    <Text style={styles.labelSecao}>Minha Residência</Text>
                    <Text style={styles.nomeResidencia}>{nomeResidencia}</Text>
                    <Text style={styles.labelSecao}>Código de convite</Text>
                    <TouchableOpacity style={styles.codigoContainer} onPress={copiarCodigo}>
                        <Text style={styles.codigo}>{codigoConvite}</Text>
                        <MaterialCommunityIcons name="content-copy" size={32} color={CORES.cinza}/>
                    </TouchableOpacity>
                    <Text style={styles.dica}>Toque para copiar e compartilhar</Text>
                </View>
            ) : (
                <View style={[styles.card, styles.semCasa]}>
                    <MaterialCommunityIcons name="home-alert" size={32} color={CORES.cinza}/>
                    <Text style={styles.semCasaTexto}>Você não está em uma residência</Text>
                </View>
            )}

            <TouchableOpacity style={styles.botaoSair} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={20} color={CORES.branco}/>
                <Text style={styles.textoBotaoSair}>Sair da Conta</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: TAMANHOS.padding,
        backgroundColor: CORES.fundoapp,
        gap: 16,
    },
    card: {
        backgroundColor: CORES.branco,
        padding: 20,
        borderRadius: TAMANHOS.borderRadiusLarge,
        elevation: 2,
        shadowColor: CORES.preto,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        alignItems: 'center',
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: CORES.verdeprincipal,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    nome: { fontSize: TAMANHOS.fontSize.g, fontFamily: FONTE.bold, color: CORES.preto },
    email: {
        fontSize: TAMANHOS.fontSize.m,
        fontFamily: FONTE.regular,
        color: CORES.cinza,
        marginTop: 4,
    },
    labelSecao: {
        fontSize: TAMANHOS.fontSize.p,
        fontFamily: FONTE.regular,
        color: CORES.cinzaclaro,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 12,
        alignSelf: 'flex-start',
    },
    nomeResidencia: {
        fontSize: TAMANHOS.fontSize.m,
        fontFamily: FONTE.bold,
        color: CORES.preto,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    codigoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: CORES.fundoapp,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: TAMANHOS.borderRadius,
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: CORES.verdeprincipal,
        borderStyle: 'dashed',
    },
    codigo: {
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
    semCasa: { gap: 8 },
    semCasaTexto: {
        fontSize: TAMANHOS.fontSize.m,
        fontFamily: FONTE.regular,
        color: CORES.cinza,
        textAlign: 'center',
    },
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