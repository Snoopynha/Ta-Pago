import { View, Text, StyleSheet } from 'react-native';

export default function Historico() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Histórico de Pagamentos</Text>
            <Text style={styles.subtitle}>Carregando histórico do backend...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#6B7280' }
});