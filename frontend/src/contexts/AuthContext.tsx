import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';
import { useRouter } from 'expo-router';

// Tipagem
type AuthContextType = {
    signed: boolean;
    user: any | null;
    signIn: (email: string, senha: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateUser: (novosDados: any) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function carregarDadosSalvos() {
            const usuarioSalvo = await AsyncStorage.getItem('@HomeFinance:user');
            if (usuarioSalvo) {
                setUser(JSON.parse(usuarioSalvo));
            }
        }
        carregarDadosSalvos();
    }, []);

    async function signIn(email: string, senha: string): Promise<void> {
        const response = await api.post('/logar', { email, senha });
        const { token, usuario } = response.data;

        setUser(usuario);
        await AsyncStorage.setItem('@HomeFinance:token', token);
        await AsyncStorage.setItem('@HomeFinance:user', JSON.stringify(usuario));
        router.replace('/(tabs)/dashboard');
    }

    async function signOut(): Promise<void> {
        setUser(null);
        await AsyncStorage.multiRemove(['@HomeFinance:token', '@HomeFinance:user']);
        router.replace('/');
    }

    function updateUser(novosDados: any): void {
        setUser(novosDados);
    }

    return (
        <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);