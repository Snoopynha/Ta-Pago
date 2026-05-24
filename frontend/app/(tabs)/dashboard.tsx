import { View, Text, StyleSheet } from 'react-native';

export default function Dashboard() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Bem-vindo ao Dashboard!</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    title: { fontSize: 20, color: '#0D9488', fontWeight: 'bold' }
});