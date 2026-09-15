import { ScrollView, Text, StyleSheet } from 'react-native';
export default function ResalePayoutsScreen() { return <ScrollView contentContainerStyle={styles.screen}><Text style={styles.title}>Resale Payouts</Text><Text style={styles.body}>AK Fashion Plus mobile module connected through shared API services.</Text></ScrollView>; }
const styles = StyleSheet.create({ screen: { padding: 18, gap: 10, backgroundColor: '#F7F5EF' }, title: { color: '#1D1D1B', fontSize: 28, fontWeight: '800' }, body: { color: '#6B665A', lineHeight: 22 } });
