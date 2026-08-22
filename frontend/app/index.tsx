import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { Link } from 'expo-router';
import { CORES, FONTE, TAMANHOS } from '@/src/styles/tema';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    setErro('');
    if (!email || !senha) {setErro('Informe o email e a senha!'); return;}

    setCarregando(true);
    try {
      await signIn(email, senha);
    } catch (e: any) {
      setErro('Email ou senha inválidos.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logo}>Ta Pago</Text>
          <Text style={styles.tagline}>Controle financeiro doméstico</Text>
        </View>
        
        {/* Formulário */}
        <View style={styles.card}>
          <View style={styles.campo}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={20} color={CORES.cinzaclaro} style={styles.inputIcone}/>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={CORES.cinzaclaro}
                value={email}
                onChangeText={(t) => { setEmail(t); setErro(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
          </View>
          <View style={styles.campo}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={CORES.cinzaclaro} style={styles.inputIcone}/>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="******"
                placeholderTextColor={CORES.cinzaclaro}
                value={senha}
                onChangeText={(t) => { setSenha(t); setErro(''); }}
                secureTextEntry={!senhaVisivel}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)} style={styles.toggleSenha}>
                <MaterialCommunityIcons name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'} size={20} color={CORES.cinzaclaro}/>
              </TouchableOpacity>
            </View>
          </View>
          
          {erro ? (
            <View style={styles.erroContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={CORES.vermelho}/>
              <Text style={styles.erroTexto}>{erro}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={[styles.botao, carregando && styles.botaoDesabilitado]} onPress={handleLogin} disabled={carregando}>
            {carregando 
              ? <ActivityIndicator color={CORES.branco}/> 
              : <Text style={styles.textoBotao}>Entrar</Text>
            }
          </TouchableOpacity>
        </View>
        
        <Link href="/cadastro" asChild>
          <TouchableOpacity style={styles.linkCadastro}>
            <Text style={styles.textoLinkCadastro}>
              Não tem conta?{' '}
              <Text style={styles.textoLinkDestaque}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundoapp },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: TAMANHOS.padding,
    gap: 24,
  },
  logoArea: { alignItems: 'center', gap: 8 },
  logo: { fontSize: 60, fontFamily: FONTE.logo, color: CORES.verdeprincipal },
  tagline: { fontSize: TAMANHOS.fontSize.m, fontFamily: FONTE.regular, color: CORES.cinza },
  card: {
    backgroundColor: CORES.branco,
    borderRadius: TAMANHOS.borderRadiusLarge,
    padding: TAMANHOS.padding,
    gap: 16,
    elevation: 2,
    shadowColor: CORES.preto,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  campo: { gap: 6 },
  label: {
    fontSize: TAMANHOS.fontSize.p,
    fontFamily: FONTE.bold,
    color: CORES.cinza,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.fundoapp,
    borderRadius: TAMANHOS.borderRadius,
    borderWidth: 1,
    borderColor: CORES.borda,
    paddingHorizontal: 12,
  },
  inputIcone: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontFamily: FONTE.regular,
    fontSize: TAMANHOS.fontSize.m,
    color: CORES.preto,
  },
  toggleSenha: { padding: 4, marginLeft: 4 },
  erroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CORES.vermelho + '15',
    padding: 10,
    borderRadius: TAMANHOS.borderRadius,
    borderWidth: 1,
    borderColor: CORES.vermelho + '30',
  },
  erroTexto: {
    fontSize: TAMANHOS.fontSize.p,
    fontFamily: FONTE.regular,
    color: CORES.vermelho,
    flex: 1,
  },
  botao: {
    backgroundColor: CORES.verdeprincipal,
    padding: 15,
    borderRadius: TAMANHOS.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  botaoDesabilitado: { opacity: 0.7 },
  textoBotao: { color: CORES.branco, fontFamily: FONTE.bold, fontSize: TAMANHOS.fontSize.m },
  linkCadastro: { alignItems: 'center', padding: 8 },
  textoLinkCadastro: { fontSize: TAMANHOS.fontSize.m, fontFamily: FONTE.regular, color: CORES.cinza },
  textoLinkDestaque: { fontFamily: FONTE.bold, color: CORES.verdeprincipal },
});