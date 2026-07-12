import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const text = (value) => value == null || value === '' ? '—' : String(value)
const safeFilename = (value) => String(value || 'consultor')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase()

export function downloadTalentConsultantReport(report, { t, locale = 'pt-PT' }) {
  if (!report?.consultant) throw new Error(t('managerConsultor.report.erroSemDados'))

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  const date = (value, includeTime = false) => {
    if (!value) return '—'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return text(value)
    return new Intl.DateTimeFormat(locale, includeTime
      ? { dateStyle: 'short', timeStyle: 'short' }
      : { dateStyle: 'short' }).format(parsed)
  }
  const status = (code, fallback) => t(`api.statusCodes.${code}`, { defaultValue: fallback || code || '—' })
  let cursorY = 28

  doc.setProperties({
    title: t('managerConsultor.report.documentTitle', { nome: report.consultant.name }),
    subject: t('managerConsultor.report.subtitle'),
  })
  doc.setFontSize(18)
  doc.setTextColor(15, 23, 42)
  doc.text(t('managerConsultor.report.title'), 14, 15)
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text(`${report.consultant.name} · ${t('managerConsultor.report.generatedAt')}: ${date(report.generatedAt, true)}`, 14, 22)

  const addSection = (title, headers, rows, options = {}) => {
    if (cursorY > pageHeight - 28) {
      doc.addPage()
      cursorY = 16
    }
    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42)
    doc.text(title, 14, cursorY)
    cursorY += 3

    if (rows.length === 0) {
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(t('managerConsultor.report.noData'), 14, cursorY + 6)
      cursorY += 13
      return
    }

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: cursorY + 2,
      margin: { left: 14, right: 14, top: 14, bottom: 14 },
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: [3, 126, 181], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 248, 252] },
      ...options,
    })
    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 10
  }

  const consultant = report.consultant
  addSection(t('managerConsultor.report.sections.profile'), [
    t('managerConsultor.report.fields.field'),
    t('managerConsultor.report.fields.value'),
  ], [
    [t('managerConsultor.report.fields.name'), text(consultant.name)],
    [t('managerConsultor.report.fields.email'), text(consultant.email)],
    [t('managerConsultor.report.fields.role'), text(consultant.role)],
    [t('managerConsultor.report.fields.area'), text(consultant.area)],
    [t('managerConsultor.report.fields.serviceLine'), text(consultant.serviceLine)],
    [t('managerConsultor.report.fields.learningPath'), text(consultant.learningPath)],
    [t('managerConsultor.report.fields.startDate'), text(consultant.startDate)],
    [t('managerConsultor.report.fields.rank'), text(consultant.rank)],
    [t('managerConsultor.report.fields.linkedin'), text(consultant.linkedinUrl)],
    [t('managerConsultor.report.fields.biography'), text(consultant.biography)],
  ], { columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' } } })

  addSection(t('managerConsultor.report.sections.summary'), [
    t('managerConsultor.report.fields.points'),
    t('managerConsultor.report.fields.badges'),
    t('managerConsultor.report.fields.applications'),
    t('managerConsultor.report.fields.approved'),
    t('managerConsultor.report.fields.rejected'),
    t('managerConsultor.report.fields.inProgress'),
    t('managerConsultor.report.fields.progress'),
  ], [[
    report.totals.points,
    report.totals.badges,
    report.totals.applications,
    report.totals.approvedApplications,
    report.totals.rejectedApplications,
    report.totals.activeApplications,
    `${Number(consultant.progress || 0)}%`,
  ]])

  addSection(t('managerConsultor.report.sections.badges'), [
    t('managerConsultor.report.fields.badge'),
    t('managerConsultor.report.fields.level'),
    t('managerConsultor.report.fields.area'),
    t('managerConsultor.report.fields.learningPath'),
    t('managerConsultor.report.fields.points'),
    t('managerConsultor.report.fields.obtainedAt'),
    t('managerConsultor.report.fields.expiresAt'),
    t('managerConsultor.report.fields.validity'),
  ], report.badges.map((badge) => [
    text(badge.nome), text(badge.nivel), text(badge.area), text(badge.learningPath), text(badge.pontos),
    date(badge.obtainedDate || badge.obtidoEm), date(badge.expirationDate || badge.expiraEm),
    t(`managerConsultor.report.validity.${badge.expiration?.code || (badge.valido === false ? 'expired' : 'valid')}`),
  ]))

  addSection(t('managerConsultor.report.sections.applications'), [
    t('managerConsultor.report.fields.trackingId'),
    t('managerConsultor.report.fields.badge'),
    t('managerConsultor.report.fields.level'),
    t('managerConsultor.report.fields.status'),
    t('managerConsultor.report.fields.submittedAt'),
    t('managerConsultor.report.fields.decisionAt'),
    t('managerConsultor.report.fields.comment'),
  ], report.applications.map((application) => [
    text(application.trackingId), text(application.badge), text(application.nivel),
    status(application.status?.code, application.status?.name), date(application.submittedAt),
    date(application.decisionAt), text(application.comentario),
  ]))

  addSection(t('managerConsultor.report.sections.applicationHistory'), [
    t('managerConsultor.report.fields.trackingId'),
    t('managerConsultor.report.fields.badge'),
    t('managerConsultor.report.fields.transition'),
    t('managerConsultor.report.fields.author'),
    t('managerConsultor.report.fields.date'),
    t('managerConsultor.report.fields.reason'),
  ], report.applicationHistory.map((event) => [
    text(event.trackingId), text(event.badge),
    `${status(event.previousCode)} -> ${status(event.code, event.estado)}`,
    text(event.autor), date(event.data || event.createdAt, true), text(event.motivo),
  ]))

  addSection(t('managerConsultor.report.sections.evidences'), [
    t('managerConsultor.report.fields.trackingId'),
    t('managerConsultor.report.fields.badge'),
    t('managerConsultor.report.fields.file'),
    t('managerConsultor.report.fields.requirement'),
    t('managerConsultor.report.fields.validation'),
    t('managerConsultor.report.fields.url'),
  ], report.evidences.map((evidence) => [
    text(evidence.trackingId), text(evidence.badge), text(evidence.nomeFicheiro || evidence.nome),
    text(evidence.Requirement?.titulo || evidence.requisito),
    evidence.validado === true
      ? t('managerConsultor.report.evidence.validated')
      : evidence.validado === false ? t('managerConsultor.report.evidence.rejected') : t('managerConsultor.report.evidence.pending'),
    text(evidence.url),
  ]), { columnStyles: { 5: { cellWidth: 72 } } })

  addSection(t('managerConsultor.report.sections.specialAchievements'), [
    t('managerConsultor.report.fields.achievement'),
    t('managerConsultor.report.fields.description'),
    t('managerConsultor.report.fields.date'),
  ], report.specialAchievements.map((achievement) => [
    text(achievement.name), text(achievement.description || achievement.criteriaDescription), date(achievement.achievementDate),
  ]))

  addSection(t('managerConsultor.report.sections.timeline'), [
    t('managerConsultor.report.fields.goal'),
    t('managerConsultor.report.fields.type'),
    t('managerConsultor.report.fields.status'),
    t('managerConsultor.report.fields.startDate'),
    t('managerConsultor.report.fields.expectedDate'),
  ], report.timeline.map((item) => [
    text(item.title), text(item.type), text(item.status), date(item.startDate), date(item.expectedDate),
  ]))

  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(t('managerConsultor.report.page', { page, pages }), pageWidth - 14, pageHeight - 6, { align: 'right' })
  }

  doc.save(`relatorio-completo-${safeFilename(consultant.name)}.pdf`)
}
