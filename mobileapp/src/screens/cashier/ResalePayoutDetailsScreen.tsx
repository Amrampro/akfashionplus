import { ScrollView, Text, StyleSheet } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
export default function ResalePayoutDetailsScreen() { const { t } = useLanguage(); return <ScrollView contentContainerStyle={styles.screen}><Text style={styles.title}>{t('resalesPage.title')}</Text><Text style={styles.body}>{t('resalesPage.body')}</Text></ScrollView>; }
const styles = StyleSheet.create({ screen: { padding: 18, gap: 10, backgroundColor: '#F7F5EF' }, title: { color: '#1D1D1B', fontSize: 28, fontWeight: '800' }, body: { color: '#6B665A', lineHeight: 22 } });
