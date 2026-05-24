import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function Contas() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Contas a Pagar</Text>
            <Text style={styles.subtitle}>Lista...</Text>

            <TouchableOpacity style={styles.fab}>
                <Text style={styles.fabText}>+ Nova Conta</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#6B7280' },
    fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#0D9488', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 30, elevation: 5 },
    fabText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});