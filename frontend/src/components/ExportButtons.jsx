import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useTranslation } from 'react-i18next' // <-- Import do hook

export default function ExportButtons({ data }) {
  const { t } = useTranslation() // <-- Inicializa a tradução
  const [busy, setBusy] = useState(null)

  // 1. Exportação Excel (CSV)
  const exportarExcel = () => {
    if (!data || data.length === 0) return alert(t('exportButtons.semDados'))
    
    setBusy('excel')
    
    const headers = [
      t('exportButtons.colunas.nome'), 
      t('exportButtons.colunas.email'), 
      t('exportButtons.colunas.papel'), 
      t('exportButtons.colunas.estado')
    ]
    
    const csvContent = [
      headers.join(','),
      ...data.map(u => [
        `"${u.nome || ''}"`,
        `"${u.email || ''}"`,
        `"${(u.roles || []).join(', ')}"`,
        `"${u.ativo ? t('exportButtons.ativo') : t('exportButtons.inativo')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${t('exportButtons.nomeFicheiro')}.csv`
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
      head: [[
        t('exportButtons.colunas.nome'), 
        t('exportButtons.colunas.email'), 
        t('exportButtons.colunas.papel'), 
        t('exportButtons.colunas.estado')
      ]],
      body: data.map(u => [
        u.nome || '', 
        u.email || '', 
        (u.roles || []).join(', '), 
        u.ativo ? t('exportButtons.ativo') : t('exportButtons.inativo')
      ]),
      startY: 25,
      theme: 'striped',
    })
    
    doc.save(`${t('exportButtons.nomeFicheiro')}.pdf`)
    setBusy(null)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportarExcel}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50 disabled:opacity-60"
      >
        <FileSpreadsheet size={16} className="text-green-600" /> 
        {busy === 'excel' ? t('exportButtons.processando') : t('exportButtons.excel')}
      </button>

      <button
        onClick={exportarPDF}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50 disabled:opacity-60"
      >
        <FileText size={16} className="text-red-600" /> 
        {busy === 'pdf' ? t('exportButtons.processando') : t('exportButtons.pdf')}
      </button>
    </div>
  )
}