import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/api/api';

export default function Cadastro() {
    const router = useRouter();
    
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    const [jaTemCasa, setJaTemCasa] = useState(false);
    const [nomeResidencia, setNomeResidencia] = useState('');
    const [codigoConvite, setCodigoConvite] = useState('');

    const handleCadastro = async () => {
        try {
            const payload = {
                nome,
                email,
                senha,
                ...(jaTemCasa ? { codigo_convite: codigoConvite } : { nome_residencia: nomeResidencia })
            };

            const response = await api.post('/registrar', payload);
            Alert.alert("Sucesso!", "Conta criada. Faça login para continuar.");
            router.replace('/');
        } catch (error: any) {
            console.log(error.response?.data);
            Alert.alert("Erro ao cadastrar", error.response?.data?.msg || "Verifique os dados e tente novamente.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Criar Conta</Text>

            <TextInput style={styles.input} placeholder="Seu Nome" value={nome} onChangeText={setNome} />
            <TextInput style={styles.input} placeholder="Seu Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TextInput style={styles.input} placeholder="Sua Senha" secureTextEntry value={senha} onChangeText={setSenha} />

            <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Já tem código de convite?</Text>
                <Switch
                    value={jaTemCasa}
                    onValueChange={setJaTemCasa}
                    trackColor={{ false: "#D1D5DB", true: "#99F6E4" }}
                    thumbColor={jaTemCasa ? "#0D9488" : "#f4f3f4"}
                />
            </View>

            {jaTemCasa ? (
                <TextInput
                    style={styles.input}
                    placeholder="Código de Convite (Ex: ABC123)"
                    autoCapitalize="characters"
                    value={codigoConvite}
                    onChangeText={setCodigoConvite}
                />
            ) : (
                <TextInput
                    style={styles.input}
                    placeholder="Nome da Nova Residência (Ex: Casa de Praia)"
                    value={nomeResidencia}
                    onChangeText={setNomeResidencia}
                />
            )}

            <TouchableOpacity style={styles.button} onPress={handleCadastro}>
                <Text style={styles.buttonText}>Cadastrar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/')}>
                <Text style={styles.linkText}>Voltar para o Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#F3F4F6' },
    title: { fontSize: 32, fontWeight: 'bold', color: '#0D9488', textAlign: 'center', marginBottom: 30 },
    input: { backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#D1D5DB' },
    button: { backgroundColor: '#0D9488', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    linkText: { color: '#6B7280', textAlign: 'center', marginTop: 20, fontSize: 16 },
    switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, paddingHorizontal: 5 },
    switchText: { fontSize: 16, color: '#4B5563' }
});