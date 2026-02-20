import type { CartItem } from '@/lib/cart/cartTypes'

export async function generateCartPdf(
  items: CartItem[],
  locale: string
): Promise<Blob> {
  // Dynamically import @react-pdf/renderer to keep it client-only
  const { pdf, Document, Page, Text, View, StyleSheet } = await import(
    '@react-pdf/renderer'
  )

  const isEl = locale === 'el'
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)

  const styles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 10,
      padding: 40,
      color: '#1c1917',
    },
    header: {
      marginBottom: 24,
      borderBottomWidth: 2,
      borderBottomColor: '#1c1917',
      paddingBottom: 12,
    },
    logo: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 9,
      color: '#78716c',
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 8,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f5f5f4',
      padding: '6 8',
      borderRadius: 4,
      marginBottom: 2,
    },
    tableRow: {
      flexDirection: 'row',
      padding: '5 8',
      borderBottomWidth: 1,
      borderBottomColor: '#e7e5e4',
    },
    colSku: { width: '16%' },
    colName: { width: '32%' },
    colColor: { width: '14%' },
    colSize: { width: '14%' },
    colQty: { width: '10%', textAlign: 'right' },
    colPrice: { width: '14%', textAlign: 'right' },
    headerText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#78716c' },
    cellText: { fontSize: 9 },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: '8 8',
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: '#1c1917',
    },
    totalLabel: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      marginRight: 12,
    },
    totalAmount: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
    },
    note: {
      marginTop: 28,
      padding: 12,
      backgroundColor: '#fafaf9',
      borderRadius: 4,
    },
    noteText: {
      fontSize: 8.5,
      color: '#78716c',
      lineHeight: 1.5,
    },
  })

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(amount)

  const dateStr = new Date().toLocaleDateString(isEl ? 'el-GR' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>ePresent</Text>
          <Text style={styles.subtitle}>
            {isEl ? 'Τουριστικά Προϊόντα Χονδρικής' : 'Wholesale Tourist Products'}
          </Text>
        </View>

        {/* Date */}
        <View style={styles.dateRow}>
          <Text style={{ fontSize: 9, color: '#78716c' }}>
            {isEl ? 'Επιλογή Προϊόντων' : 'Product Selection'}
          </Text>
          <Text style={{ fontSize: 9, color: '#78716c' }}>{dateStr}</Text>
        </View>

        {/* Table */}
        <Text style={styles.sectionTitle}>
          {isEl ? 'Επιλεγμένα Προϊόντα' : 'Selected Products'}
        </Text>

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colSku, styles.headerText]}>
            {isEl ? 'Κωδικός' : 'SKU'}
          </Text>
          <Text style={[styles.colName, styles.headerText]}>
            {isEl ? 'Προϊόν' : 'Product'}
          </Text>
          <Text style={[styles.colColor, styles.headerText]}>
            {isEl ? 'Χρώμα' : 'Color'}
          </Text>
          <Text style={[styles.colSize, styles.headerText]}>
            {isEl ? 'Μέγεθος' : 'Size'}
          </Text>
          <Text style={[styles.colQty, styles.headerText]}>
            {isEl ? 'Ποσ.' : 'Qty'}
          </Text>
          <Text style={[styles.colPrice, styles.headerText]}>
            {isEl ? 'Τιμή' : 'Price'}
          </Text>
        </View>

        {/* Table rows */}
        {items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.colSku, styles.cellText]}>{item.sku}</Text>
            <Text style={[styles.colName, styles.cellText]}>
              {isEl ? item.nameEl : item.nameEn}
            </Text>
            <Text style={[styles.colColor, styles.cellText]}>
              {item.variant
                ? isEl
                  ? item.variant.colorNameEl
                  : item.variant.colorNameEn
                : '—'}
            </Text>
            <Text style={[styles.colSize, styles.cellText]}>
              {item.size
                ? isEl
                  ? item.size.labelEl
                  : item.size.labelEn
                : '—'}
            </Text>
            <Text style={[styles.colQty, styles.cellText]}>{item.qty}</Text>
            <Text style={[styles.colPrice, styles.cellText]}>
              {formatCurrency(item.price * item.qty)}
            </Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            {isEl ? 'Εκτιμώμενο Σύνολο:' : 'Estimated Total:'}
          </Text>
          <Text style={styles.totalAmount}>{formatCurrency(subtotal)}</Text>
        </View>

        {/* Note */}
        <View style={styles.note}>
          <Text style={styles.noteText}>
            {isEl
              ? 'Αυτή η επιλογή δημιουργήθηκε μέσω του καταλόγου ePresent. Οι τιμές είναι ενδεικτικές τιμές χονδρικής. Επικοινωνήστε μαζί μας για να ολοκληρώσετε την παραγγελία σας.'
              : 'This selection was created via the ePresent catalog. Prices shown are indicative wholesale prices. Contact us to finalise your order.'}
          </Text>
        </View>
      </Page>
    </Document>
  )

  const instance = pdf(doc)
  const blob = await instance.toBlob()
  return blob
}
