import { Document, Page, Text, View, Font, StyleSheet } from '@react-pdf/renderer'

// SPIKE RESULT: FAIL — @react-pdf/renderer v4 uses PDFKit with no text shaping engine
// (no HarfBuzz, no bidi, no Indic GSUB/GPOS). Bangla conjuncts (e.g., ক্ষ) render as
// disconnected glyphs. Fallback: window.print() via PrintableInvoice (OS renderer shapes correctly).

Font.register({
  family: 'HindSiliguri',
  fonts: [
    { src: '/fonts/HindSiliguri-Regular.ttf' },
    { src: '/fonts/HindSiliguri-Bold.ttf', fontWeight: 'bold' },
  ],
})

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'HindSiliguri' },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, fontFamily: 'Helvetica' },
  label: { fontFamily: 'Helvetica', fontSize: 9, color: '#999', marginBottom: 2 },
  test: { fontSize: 14, marginBottom: 12 },
  note: { fontFamily: 'Helvetica', fontSize: 10, color: '#555', marginBottom: 24 },
})

const TEST_STRINGS = [
  { label: 'Simple characters:', text: 'বাংলা বর্ণমালা' },
  { label: 'Conjunct (ক্ষ — two consonants joined):', text: 'ক্ষমা ক্ষেত্র' },
  { label: 'Vowel marks (কি কু কে কো কা):', text: 'কি কু কে কো কা' },
  { label: 'Bangla numerals:', text: '১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯ ০' },
  { label: 'Order phrase:', text: 'আপনার অর্ডার ডেলিভারি হয়েছে' },
  { label: 'Thank you:', text: 'ধন্যবাদ আপনার কেনাকাটার জন্য' },
  { label: 'Invoice label:', text: 'চালান নম্বর: ORD-০০০০০১' },
]

export function FontTestDocument() {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Bangla Font Rendering Spike</Text>
        <Text style={styles.note}>
          Pass: ক্ষ shows as a single joined ligature. Vowel marks attach to consonants.
          Fail: disconnected characters, floating marks, or □ boxes.
        </Text>
        {TEST_STRINGS.map(({ label, text }) => (
          <View key={label} style={{ marginBottom: 4 }}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.test}>{text}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}
