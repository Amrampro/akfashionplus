import { Text, View, StyleSheet } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
export default function ResellToCompanyOption({ title }: { title?: string }) { const { t } = useLanguage(); return <View style={styles.card}><Text style={styles.text}>{title || t('orderDetails.resaleTitle')}</Text></View>; }
const styles = StyleSheet.create({ card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E4DECE' }, text: { color: '#1D1D1B', fontWeight: '700' } });
