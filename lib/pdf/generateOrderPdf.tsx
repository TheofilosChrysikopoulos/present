import type { EnquiryCartItem } from '@/lib/types'

let robotoRegistered = false

export interface OrderPdfData {
  orderNumber?: number
  customerName: string
  customerEmail: string
  customerLocation?: string
  message?: string | null
  notes?: string | null
  items: EnquiryCartItem[]
  createdAt: string
  status?: string
}

export async function generateOrderPdf(
  data: OrderPdfData,
  locale: string
): Promise<Blob> {
  const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import(
    '@react-pdf/renderer'
  )

  const isEl = locale === 'el'

  // Register Roboto font only once
  if (!robotoRegistered) {
    try {
      const base = window.location.origin
      const [regularBuf, boldBuf] = await Promise.all([
        fetch(`${base}/fonts/Roboto-Regular.ttf`).then((r) => r.arrayBuffer()),
        fetch(`${base}/fonts/Roboto-Bold.ttf`).then((r) => r.arrayBuffer()),
      ])

      const toDataUrl = (buf: ArrayBuffer) => {
        const bytes = new Uint8Array(buf)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        return `data:font/truetype;base64,${btoa(binary)}`
      }

      Font.register({ family: 'Roboto', src: toDataUrl(regularBuf) })
      Font.register({ family: 'Roboto-Bold', src: toDataUrl(boldBuf) })
      robotoRegistered = true
    } catch (e) {
      console.warn('Failed to load Roboto font, falling back to Helvetica', e)
    }
  }

  const fontFamily = robotoRegistered ? 'Roboto' : 'Helvetica'
  const fontFamilyBold = robotoRegistered ? 'Roboto-Bold' : 'Helvetica-Bold'
  const subtotal = data.items.reduce((sum, i) => sum + i.price * i.qty, 0)

  const styles = StyleSheet.create({
    page: {
      fontFamily,
      fontSize: 10,
      padding: 40,
      color: '#1c1917',
    },
    header: {
      marginBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: '#1c1917',
      paddingBottom: 12,
    },
    logo: {
      fontSize: 20,
      fontFamily: fontFamilyBold,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 9,
      color: '#78716c',
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    infoCol: {
      width: '48%',
    },
    infoLabel: {
      fontSize: 8,
      color: '#78716c',
      marginBottom: 2,
      textTransform: 'uppercase' as const,
    },
    infoValue: {
      fontSize: 10,
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: fontFamilyBold,
      marginBottom: 8,
    },
    messageBox: {
      marginBottom: 16,
      padding: 10,
      backgroundColor: '#fafaf9',
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: '#B13D82',
    },
    messageLabel: {
      fontSize: 8,
      fontFamily: fontFamilyBold,
      color: '#78716c',
      marginBottom: 4,
      textTransform: 'uppercase' as const,
    },
    messageText: {
      fontSize: 9,
      color: '#44403c',
      lineHeight: 1.5,
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
    colName: { width: '28%' },
    colColor: { width: '14%' },
    colSize: { width: '14%' },
    colQty: { width: '10%', textAlign: 'right' },
    colPrice: { width: '18%', textAlign: 'right' },
    headerText: { fontSize: 9, fontFamily: fontFamilyBold, color: '#78716c' },
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
      fontFamily: fontFamilyBold,
      marginRight: 12,
    },
    totalAmount: {
      fontSize: 12,
      fontFamily: fontFamilyBold,
    },
    footer: {
      marginTop: 28,
      padding: 12,
      backgroundColor: '#fafaf9',
      borderRadius: 4,
    },
    footerText: {
      fontSize: 8.5,
      color: '#78716c',
      lineHeight: 1.5,
    },
  })

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(amount)

  const dateStr = new Date(data.createdAt).toLocaleDateString(isEl ? 'el-GR' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>PRESENT ACCESSORIES</Text>
          <Text style={styles.subtitle}>
            {isEl ? 'Τουριστικά Προϊόντα Χονδρικής' : 'Wholesale Tourist Products'}
          </Text>
        </View>

        {/* Order info + customer info */}
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            {data.orderNumber && (
              <>
                <Text style={styles.infoLabel}>
                  {isEl ? 'Αρ. Παραγγελίας' : 'Order No.'}
                </Text>
                <Text style={styles.infoValue}>#{data.orderNumber}</Text>
              </>
            )}
            <Text style={styles.infoLabel}>
              {isEl ? 'Ημερομηνία' : 'Date'}
            </Text>
            <Text style={styles.infoValue}>{dateStr}</Text>
            {data.status && (
              <>
                <Text style={styles.infoLabel}>
                  {isEl ? 'Κατάσταση' : 'Status'}
                </Text>
                <Text style={styles.infoValue}>
                  {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                </Text>
              </>
            )}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>
              {isEl ? 'Πελάτης' : 'Customer'}
            </Text>
            <Text style={styles.infoValue}>{data.customerName}</Text>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{data.customerEmail}</Text>
            {data.customerLocation && (
              <>
                <Text style={styles.infoLabel}>
                  {isEl ? 'Τοποθεσία' : 'Location'}
                </Text>
                <Text style={styles.infoValue}>{data.customerLocation}</Text>
              </>
            )}
          </View>
        </View>

        {/* Message / Notes */}
        {data.message && (
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>
              {isEl ? 'Μήνυμα Πελάτη' : 'Customer Message'}
            </Text>
            <Text style={styles.messageText}>{data.message}</Text>
          </View>
        )}

        {data.notes && (
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>
              {isEl ? 'Σημειώσεις' : 'Notes'}
            </Text>
            <Text style={styles.messageText}>{data.notes}</Text>
          </View>
        )}

        {/* Items table */}
        <Text style={styles.sectionTitle}>
          {isEl
            ? `Προϊόντα (${data.items.length} ${data.items.length === 1 ? 'αντικείμενο' : 'αντικείμενα'})`
            : `Products (${data.items.length} ${data.items.length === 1 ? 'item' : 'items'})`}
        </Text>

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
            {isEl ? 'Σύνολο' : 'Total'}
          </Text>
        </View>

        {data.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.colSku, styles.cellText]}>{item.sku}</Text>
            <Text style={[styles.colName, styles.cellText]}>
              {isEl ? item.name_el : item.name_en}
            </Text>
            <Text style={[styles.colColor, styles.cellText]}>
              {item.variant_color_en
                ? isEl
                  ? item.variant_color_el ?? item.variant_color_en
                  : item.variant_color_en
                : '—'}
            </Text>
            <Text style={[styles.colSize, styles.cellText]}>
              {item.size_label_en
                ? isEl
                  ? item.size_label_el ?? item.size_label_en
                  : item.size_label_en
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
            {isEl ? 'Σύνολο:' : 'Total:'}
          </Text>
          <Text style={styles.totalAmount}>{formatCurrency(subtotal)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isEl
              ? 'Αυτό το έγγραφο δημιουργήθηκε μέσω του συστήματος PRESENT ACCESSORIES. Τηλ: 26610 47265 / 26610 46584 | Email: present.summerfashion@gmail.com'
              : 'This document was generated via the PRESENT ACCESSORIES system. Tel: 26610 47265 / 26610 46584 | Email: present.summerfashion@gmail.com'}
          </Text>
        </View>
      </Page>
    </Document>
  )

  const instance = pdf(doc)
  const blob = await instance.toBlob()
  return blob
}
