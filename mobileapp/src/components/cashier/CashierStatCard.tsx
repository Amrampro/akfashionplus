import { Text, View, StyleSheet } from 'react-native';
export default function CashierStatCard({ title = 'CashierStatCard' }: { title?: string }) { return <View style={styles.card}><Text style={styles.text}>{title}</Text></View>; }
const styles = StyleSheet.create({ card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E4DECE' }, text: { color: '#1D1D1B', fontWeight: '700' } });
