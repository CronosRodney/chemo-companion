import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #1e40af',
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    width: '35%',
  },
  value: {
    fontSize: 10,
    color: '#111827',
    width: '65%',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottom: '1 solid #e5e7eb',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #f3f4f6',
  },
  tableCell: {
    fontSize: 9,
    color: '#4b5563',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '2 6',
    borderRadius: 4,
    fontSize: 8,
  },
  alertBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '2 6',
    borderRadius: 4,
    fontSize: 8,
  },
});

// Types
interface PatientProfile {
  first_name: string;
  last_name?: string;
  birth_date?: string;
  email?: string;
  phone?: string;
  medical_history?: string;
  allergies?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface TreatmentPlan {
  regimen_name: string;
  line_of_therapy: string;
  treatment_intent: string;
  planned_cycles: number;
  start_date: string;
  status?: string;
}

interface TreatmentCycle {
  cycle_number: number;
  scheduled_date: string;
  actual_date?: string;
  status?: string;
  release_status: string;
}

interface Medication {
  name: string;
  dose?: string;
  frequency?: string;
  scanned_at: string;
}

interface Event {
  title: string;
  event_type: string;
  event_date: string;
  severity?: number;
  description?: string;
}

export interface ReportData {
  profile: PatientProfile;
  treatments?: TreatmentPlan[];
  cycles?: TreatmentCycle[];
  medications?: Medication[];
  events?: Event[];
  generatedAt: Date;
}

// PDF Document Component
const MedicalReportDocument = ({ data }: { data: ReportData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Relatório Médico OncoTrack</Text>
        <Text style={styles.headerSubtitle}>
          Paciente: {data.profile.first_name} {data.profile.last_name || ''}
        </Text>
        <Text style={styles.headerSubtitle}>
          Gerado em: {format(data.generatedAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
        </Text>
      </View>

      {/* Patient Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações do Paciente</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nome Completo:</Text>
          <Text style={styles.value}>{data.profile.first_name} {data.profile.last_name || ''}</Text>
        </View>
        {data.profile.birth_date && (
          <View style={styles.row}>
            <Text style={styles.label}>Data de Nascimento:</Text>
            <Text style={styles.value}>{format(new Date(data.profile.birth_date), 'dd/MM/yyyy')}</Text>
          </View>
        )}
        {data.profile.email && (
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.profile.email}</Text>
          </View>
        )}
        {data.profile.phone && (
          <View style={styles.row}>
            <Text style={styles.label}>Telefone:</Text>
            <Text style={styles.value}>{data.profile.phone}</Text>
          </View>
        )}
        {data.profile.medical_history && (
          <View style={styles.row}>
            <Text style={styles.label}>Histórico Médico:</Text>
            <Text style={styles.value}>{data.profile.medical_history}</Text>
          </View>
        )}
        {data.profile.allergies && (
          <View style={styles.row}>
            <Text style={styles.label}>Alergias:</Text>
            <Text style={styles.value}>{data.profile.allergies}</Text>
          </View>
        )}
        {data.profile.emergency_contact_name && (
          <View style={styles.row}>
            <Text style={styles.label}>Contato de Emergência:</Text>
            <Text style={styles.value}>
              {data.profile.emergency_contact_name} - {data.profile.emergency_contact_phone || 'N/A'}
            </Text>
          </View>
        )}
      </View>

      {/* Treatment Plans */}
      {data.treatments && data.treatments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planos de Tratamento</Text>
          {data.treatments.map((treatment, index) => (
            <View key={index} style={{ marginBottom: 15 }}>
              <View style={styles.row}>
                <Text style={styles.label}>Protocolo:</Text>
                <Text style={styles.value}>{treatment.regimen_name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Linha de Tratamento:</Text>
                <Text style={styles.value}>{treatment.line_of_therapy}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Intenção:</Text>
                <Text style={styles.value}>{treatment.treatment_intent}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Ciclos Planejados:</Text>
                <Text style={styles.value}>{treatment.planned_cycles}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Data de Início:</Text>
                <Text style={styles.value}>{format(new Date(treatment.start_date), 'dd/MM/yyyy')}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Status:</Text>
                <Text style={styles.value}>{treatment.status || 'Ativo'}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Cycles */}
      {data.cycles && data.cycles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ciclos de Tratamento</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Ciclo</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Data Prevista</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Data Real</Text>
              <Text style={[styles.tableHeaderCell, { width: '35%' }]}>Status</Text>
            </View>
            {data.cycles.map((cycle, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '15%' }]}>C{cycle.cycle_number}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>
                  {format(new Date(cycle.scheduled_date), 'dd/MM/yyyy')}
                </Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>
                  {cycle.actual_date ? format(new Date(cycle.actual_date), 'dd/MM/yyyy') : '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '35%' }]}>
                  {cycle.release_status} / {cycle.status || 'Agendado'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Medications */}
      {data.medications && data.medications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medicamentos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Medicamento</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Dose</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Frequência</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Desde</Text>
            </View>
            {data.medications.map((med, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{med.name}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{med.dose || '-'}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{med.frequency || '-'}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>
                  {format(new Date(med.scanned_at), 'dd/MM/yyyy')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Events */}
      {data.events && data.events.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Eventos (Últimos 30 dias)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Data</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Tipo</Text>
              <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Título</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Severidade</Text>
            </View>
            {data.events.slice(0, 20).map((event, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '20%' }]}>
                  {format(new Date(event.event_date), 'dd/MM/yyyy')}
                </Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{event.event_type}</Text>
                <Text style={[styles.tableCell, { width: '40%' }]}>{event.title}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>
                  {event.severity ? `${event.severity}/5` : '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        Este relatório foi gerado automaticamente pelo sistema OncoTrack.
        Documento para uso exclusivo do paciente e equipe médica autorizada.
        LGPD: Dados protegidos conforme legislação vigente.
      </Text>
    </Page>
  </Document>
);

// Export Button Component
interface MedicalReportExportProps {
  data: ReportData;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function MedicalReportExport({ data, variant = 'outline', size = 'default' }: MedicalReportExportProps) {
  const fileName = `relatorio_oncotrack_${format(new Date(), 'yyyy-MM-dd')}.pdf`;

  return (
    <PDFDownloadLink
      document={<MedicalReportDocument data={data} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button variant={variant} size={size} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

export { MedicalReportDocument };
