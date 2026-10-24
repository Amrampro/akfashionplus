import { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';

export function rentalDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function RentalCalendar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { locale, t } = useLanguage();
  const [year, month] = value.split('-').map(Number);
  const [visible, setVisible] = useState(() => new Date(year, month - 1, 1, 12));
  const today = rentalDateKey(new Date());
  const offset = (new Date(visible.getFullYear(), visible.getMonth(), 1).getDay() + 6) % 7;
  const count = new Date(visible.getFullYear(), visible.getMonth() + 1, 0).getDate();
  const previousDisabled = rentalDateKey(visible).slice(0, 7) <= today.slice(0, 7);
  return <View style={styles.calendar}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('productDetails.previousMonth')} disabled={previousDisabled}
        style={[styles.arrow, previousDisabled && styles.disabled]} onPress={() => setVisible(new Date(visible.getFullYear(), visible.getMonth() - 1, 1, 12))}>
        <Text style={styles.text}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.month}>{visible.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('productDetails.nextMonth')} style={styles.arrow}
        onPress={() => setVisible(new Date(visible.getFullYear(), visible.getMonth() + 1, 1, 12))}>
        <Text style={styles.text}>›</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.grid}>
      {Array.from({ length: 7 }, (_, i) => <View key={`weekday-${i}`} style={styles.cell}>
        <Text style={styles.weekday}>{new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' })}</Text>
      </View>)}
      {Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, i) => {
        const day = i - offset + 1;
        if (day < 1 || day > count) return <View key={i} style={styles.cell} />;
        const date = new Date(visible.getFullYear(), visible.getMonth(), day, 12);
        const key = rentalDateKey(date);
        const disabled = key < today;
        return <TouchableOpacity key={i} accessibilityRole="button" accessibilityLabel={date.toLocaleDateString(locale, { dateStyle: 'full' })}
          accessibilityState={{ selected: value === key, disabled }} disabled={disabled}
          onPress={() => onChange(key)} style={[styles.cell, value === key && styles.selected, disabled && styles.disabled]}>
          <Text style={[styles.text, value === key && styles.selectedText]}>{day}</Text>
        </TouchableOpacity>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  calendar: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#E4DECE' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { flex: 1, textAlign: 'center', color: '#071846', fontWeight: '700' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.285714%', height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  text: { color: '#071846', fontWeight: '700' }, weekday: { color: '#665F54' },
  selected: { backgroundColor: '#071846' }, selectedText: { color: '#FFFFFF' }, disabled: { opacity: 0.3 },
});
