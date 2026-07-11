import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useTranslation } from 'react-i18next' // <-- Import do hook

// Por omissão exporta uma lista de utilizadores (nome/email/papel/estado),
// comportamento original deste componente. Passando `columns` (array de
// { key, label }) e `data` com objetos já formatados para essas keys,
// o componente serve para exportar qualquer lista (pedidos, badges, etc.).
export default function ExportButtons({ data, columns, filename }) {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const [busy, setBusy] = useState(null)

  const cols = columns || [
    { key: 'nome', label: t('exportButtons.colunas.nome') },
    { key: 'email', label: t('exportButtons.colunas.email') },
    { key: 'papel', label: t('exportButtons.colunas.papel') },
    { key: 'estado', label: t('exportButtons.colunas.estado') },
  ]
  const nomeFicheiro = filename || t('exportButtons.nomeFicheiro')

  const linhas = (data || []).map((item) => {
    if (columns) return cols.map((c) => item[c.key] ?? '')
    return [
      item.nome || '',
      item.email || '',
      (item.roles || []).join(', '),
      item.ativo ? t('exportButtons.ativo') : t('exportButtons.inativo'),
    ]
  })

  // 1. Exportação Excel (CSV)
  const exportarExcel = () => {
    if (!data || data.length === 0) return alert(t('exportButtons.semDados'))

    setBusy('excel')

    const csvContent = [
      cols.map((c) => c.label).join(','),
      ...linhas.map((linha) => linha.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${nomeFicheiro}.csv`
    link.click()

    setBusy(null)
  }

  // 2. Exportação PDF
  const exportarPDF = () => {
    if (!data || data.length === 0) return alert(t('exportButtons.semDados'))

    setBusy('pdf')

    const doc = new jsPDF()
    doc.text(t('exportButtons.tituloRelatorio'), 14, 15)

    // Usar a função autoTable importada
    autoTable(doc, {
      head: [cols.map((c) => c.label)],
      body: linhas,
      startY: 25,
      theme: 'striped',
    })

    doc.save(`${nomeFicheiro}.pdf`)
    setBusy(null)
  }

  return (
    <div className="d-flex gap-2">
      <button
        onClick={exportarExcel}
        disabled={busy}
        className="btn btn-outline-secondary bg-white d-inline-flex align-items-center gap-2 fw-semibold"
      >
        <FileSpreadsheet size={16} className="text-success" />
        {busy === 'excel' ? t('exportButtons.processando') : t('exportButtons.excel')}
      </button>

      <button
        onClick={exportarPDF}
        disabled={busy}
        className="btn btn-outline-secondary bg-white d-inline-flex align-items-center gap-2 fw-semibold"
      >
        <FileText size={16} className="text-danger" />
        {busy === 'pdf' ? t('exportButtons.processando') : t('exportButtons.pdf')}
      </button>
    </div>
  )
}