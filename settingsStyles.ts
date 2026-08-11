import { StyleSheet } from 'react-native';
import { colors, layout } from './theme';

export const settingsStyles = StyleSheet.create({
  content: { padding: layout.screenPadding, paddingBottom: 42 },
  header: { marginBottom: 20 },
  eyebrow: { color: colors.brand, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.8, marginTop: 5 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  sectionLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 1.1, marginBottom: 10 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 10 },
  optionActive: { borderColor: colors.brand, backgroundColor: colors.brandDark },
  radio: { width: 22, height: 22, borderRadius: 11, borderColor: colors.textMuted, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  radioActive: { borderColor: colors.brand },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
  optionText: { flex: 1 },
  optionTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  optionDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  testButton: { backgroundColor: colors.brand, borderRadius: layout.buttonRadius, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  testButtonText: { color: colors.textOnBrand, fontSize: 15, fontWeight: '800' },
  infoCard: { backgroundColor: colors.surfaceElevated, borderRadius: 16, padding: 15, marginTop: 16 },
  infoTitle: { color: colors.brandSoft, fontSize: 13, fontWeight: '800' },
  infoText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
});
