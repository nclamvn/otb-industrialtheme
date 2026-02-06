/**
 * PDF Templates using @react-pdf/renderer
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

// Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    padding: 6,
    color: '#374151',
  },
  tableCellSmall: {
    flex: 0.5,
    fontSize: 10,
    padding: 6,
    color: '#374151',
  },
  tableCellLarge: {
    flex: 2,
    fontSize: 10,
    padding: 6,
    color: '#374151',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  text: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
  },
});

// Budget Report Template
interface BudgetReportData {
  title: string;
  season: string;
  generatedAt: string;
  summary: {
    totalBudget: string;
    utilized: string;
    remaining: string;
    utilizationRate: string;
  };
  budgets: {
    brand: string;
    location: string;
    allocated: string;
    utilized: string;
    status: string;
  }[];
}

export function BudgetReportPDF({ data }: { data: BudgetReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>
            Season: {data.season} | Generated: {data.generatedAt}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Budget</Text>
              <Text style={styles.statValue}>{data.summary.totalBudget}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Utilized</Text>
              <Text style={styles.statValue}>{data.summary.utilized}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={styles.statValue}>{data.summary.remaining}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Utilization Rate</Text>
              <Text style={styles.statValue}>{data.summary.utilizationRate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Allocations</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Brand</Text>
              <Text style={styles.tableCell}>Location</Text>
              <Text style={styles.tableCell}>Allocated</Text>
              <Text style={styles.tableCell}>Utilized</Text>
              <Text style={styles.tableCellSmall}>Status</Text>
            </View>
            {data.budgets.map((budget, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{budget.brand}</Text>
                <Text style={styles.tableCell}>{budget.location}</Text>
                <Text style={styles.tableCell}>{budget.allocated}</Text>
                <Text style={styles.tableCell}>{budget.utilized}</Text>
                <Text style={styles.tableCellSmall}>{budget.status}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>DAFC OTB Platform</Text>
          <Text style={styles.footerText}>Confidential</Text>
        </View>
      </Page>
    </Document>
  );
}

// OTB Plan Report Template
interface OTBReportData {
  title: string;
  brand: string;
  season: string;
  version: string;
  generatedAt: string;
  summary: {
    totalValue: string;
    skuCount: string;
    categories: string;
    status: string;
  };
  lineItems: {
    category: string;
    subcategory: string;
    buyPct: string;
    buyValue: string;
    units: string;
  }[];
}

export function OTBReportPDF({ data }: { data: OTBReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>
            {data.brand} | {data.season} | Version: {data.version}
          </Text>
          <Text style={styles.subtitle}>Generated: {data.generatedAt}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total OTB Value</Text>
              <Text style={styles.statValue}>{data.summary.totalValue}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>SKU Count</Text>
              <Text style={styles.statValue}>{data.summary.skuCount}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Categories</Text>
              <Text style={styles.statValue}>{data.summary.categories}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={styles.statValue}>{data.summary.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Category</Text>
              <Text style={styles.tableCell}>Subcategory</Text>
              <Text style={styles.tableCellSmall}>Buy %</Text>
              <Text style={styles.tableCell}>Buy Value</Text>
              <Text style={styles.tableCellSmall}>Units</Text>
            </View>
            {data.lineItems.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.category}</Text>
                <Text style={styles.tableCell}>{item.subcategory}</Text>
                <Text style={styles.tableCellSmall}>{item.buyPct}</Text>
                <Text style={styles.tableCell}>{item.buyValue}</Text>
                <Text style={styles.tableCellSmall}>{item.units}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>DAFC OTB Platform</Text>
          <Text style={styles.footerText}>Confidential</Text>
        </View>
      </Page>
    </Document>
  );
}

// Generate PDF Blob
export async function generatePDFBlob(component: React.ReactElement): Promise<Blob> {
  return await pdf(component).toBlob();
}
