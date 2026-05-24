import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const IP_DA_REDE = process.env.IP_DA_REDE;

const getBaseUrl = () => {
    if(Platform.OS === 'web') {
        return 'http://localhost:5000/api';
    }

   return `http://${IP_DA_REDE}:5000/api`;
};

const api = axios.create({
    baseURL: getBaseUrl(),
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('@HomeFinance:token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;