import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useTranslation } from 'react-i18next'
import { api, getToken } from '../services/http'

export default function ExportButtons({ data, columns, filename }) {
  const { t } = useTranslation()
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

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const descarregar = (blob, nome) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nome
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportarExcelHtml = () => {
    const table = `<table><thead><tr>${cols.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('')}</tr></thead><tbody>${linhas.map((linha) => `<tr>${linha.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    const documentHtml = `<html><head><meta charset="utf-8"></head><body>${table}</body></html>`
    const blob = new Blob(['\ufeff', documentHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    descarregar(blob, `${nomeFicheiro}.xls`)
  }

  const exportarExcel = async () => {
    if (!data || data.length === 0) return alert(t('exportButtons.semDados'))

    setBusy('excel')
    const rows = linhas.map((arr) => cols.reduce((obj, c, i) => ({ ...obj, [c.key]: arr[i] }), {}))
    try {
      const token = getToken()
      const resposta = await api.post(
        '/export/xlsx',
        { filename: nomeFicheiro, columns: cols.map((c) => ({ key: c.key, label: c.label })), rows },
        { responseType: 'blob', headers: token ? { Authorization: `Bearer ${token}` } : {} },
      )
      descarregar(resposta.data, `${nomeFicheiro}.xlsx`)
    } catch {
      exportarExcelHtml()
    } finally {
      setBusy(null)
    }
  }

  const exportarPDF = () => {
    if (!data || data.length === 0) return alert(t('exportButtons.semDados'))

    setBusy('pdf')

    const doc = new jsPDF()
    doc.text(t('exportButtons.tituloRelatorio'), 14, 15)

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
