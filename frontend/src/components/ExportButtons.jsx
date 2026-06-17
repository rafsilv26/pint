import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import * as api from '../services/api'

// Botões de exportação Excel/PDF (descarregam de /relatorios/* na API real,
// ou um CSV de demonstração em mock).
export default function ExportButtons() {
  const [busy, setBusy] = useState(null)

  async function exportar(formato) {
    setBusy(formato)
    try {
      await api.exportarRelatorio(formato)
    } catch (e) {
      alert(e.message || 'Não foi possível exportar.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportar('excel')}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50 disabled:opacity-60"
      >
        <FileSpreadsheet size={16} className="text-green-600" /> {busy === 'excel' ? 'A exportar…' : 'Excel'}
      </button>
      <button
        onClick={() => exportar('pdf')}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50 disabled:opacity-60"
      >
        <FileText size={16} className="text-red-600" /> {busy === 'pdf' ? 'A exportar…' : 'PDF'}
      </button>
    </div>
  )
}
