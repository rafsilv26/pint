import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ExportButtons({ data }) {
  const [busy, setBusy] = useState(null)

  // 1. Exportação Excel (CSV)
  const exportarExcel = () => {
    if (!data || data.length === 0) return alert("Sem dados para exportar.")
    
    setBusy('excel')
    
    const headers = ['Nome', 'Email', 'Papel', 'Estado']
    const csvContent = [
      headers.join(','),
      ...data.map(u => [
        `"${u.nome || ''}"`,
        `"${u.email || ''}"`,
        `"${(u.roles || []).join(', ')}"`,
        `"${u.ativo ? 'Ativo' : 'Inativo'}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "utilizadores.csv"
    link.click()
    
    setBusy(null)
  }

  // 2. Exportação PDF
  const exportarPDF = () => {
    if (!data || data.length === 0) return alert("Sem dados para exportar.")
    
    setBusy('pdf')
    
    const doc = new jsPDF()
    doc.text("Relatório de Utilizadores", 14, 15)
    
    // Usar a função autoTable importada
    autoTable(doc, {
      head: [['Nome', 'Email', 'Papel', 'Estado']],
      body: data.map(u => [
        u.nome || '', 
        u.email || '', 
        (u.roles || []).join(', '), 
        u.ativo ? 'Ativo' : 'Inativo'
      ]),
      startY: 25,
      theme: 'striped',
    })
    
    doc.save('utilizadores.pdf')
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
        {busy === 'excel' ? 'A processar…' : 'Excel'}
      </button>

      <button
        onClick={exportarPDF}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50 disabled:opacity-60"
      >
        <FileText size={16} className="text-red-600" /> 
        {busy === 'pdf' ? 'A processar…' : 'PDF'}
      </button>
    </div>
  )
}