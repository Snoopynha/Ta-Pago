import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';
import { useRouter } from 'expo-router';

const AuthContext = createContext<any>({});

export const AuthProvider = ({ children }: any) => {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        async function loadStorageData() {
            const storageUser = await AsyncStorage.getItem('@HomeFinance:user');
            if (storageUser) {
                setUser(JSON.parse(storageUser));
            }
        }
        loadStorageData();
    }, []);

    async function signIn(email: string, senha: string) {
        try {
            const response = await api.post('/logar', { email, senha });
            const { access_token, usuario } = response.data;

            setUser(usuario);
            await AsyncStorage.setItem('@HomeFinance:token', access_token);
            await AsyncStorage.setItem('@HomeFinance:user', JSON.stringify(usuario));

            router.replace('/(tabs)/dashboard');
        } catch (error) {
            alert("Erro ao logar. Verifique as credenciais.");
            console.log(error);
        }
    }

    return (
        <AuthContext.Provider value={{ signed: !!user, user, signIn }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);