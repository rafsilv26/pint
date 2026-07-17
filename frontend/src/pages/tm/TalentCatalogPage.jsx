import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Coins, Search, Crown } from 'lucide-react'
import { Card, EmptyState, ErrorState, PageHeader, Spinner } from '../../components/ui'
import ExportButtons from '../../components/ExportButtons'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next'

export default function TalentCatalogPage() {
  const { t } = useTranslation()
  const labels = t('tmWorkspace', { returnObjects: true })
  const [tipo, setTipo] = useState('badges')
  const { data, loading, error, reload } = useAsync(
    () => (tipo === 'premium' ? api.getBadgesPremium() : api.getTalentCatalog()),
    [tipo]
  )
  useAutoRefresh(reload)
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [level, setLevel] = useState('')
  const [availability, setAvailability] = useState('active')
  const rows = useMemo(() => data || [], [data])
  const options = useMemo(() => ({ areas: [...new Set(rows.map((row) => row.area).filter(Boolean))].sort(), levels: [...new Set(rows.map((row) => row.nivel).filter(Boolean))].sort() }), [rows])
  const isPremium = tipo === 'premium'
  // useAsync mantém data antiga durante a troca de tipo; ignora até coincidir shape
  const rowsArePremium = rows.length > 0 && rows[0].requisitos === undefined
  const stale = rows.length > 0 && rowsArePremium !== isPremium
  const filtered = isPremium
    ? rows.filter((row) => row.ativo !== false && `${row.nome} ${row.descricao} ${row.criterio}`.toLowerCase().includes(search.toLowerCase()))
    : rows.filter((row) =>
      (!area || row.area === area) &&
      (!level || row.nivel === level) &&
      (availability === 'all' || (availability === 'active' ? row.ativo !== false : row.ativo === false)) &&
      `${row.nome} ${row.fornecedor} ${row.area} ${row.serviceLine}`.toLowerCase().includes(search.toLowerCase())
    )
  const exportRows = isPremium
    ? filtered.map((row) => ({ nome: row.nome, descricao: row.descricao, criterio: row.criterio }))
    : filtered.map((row) => ({ nome: row.nome, fornecedor: row.fornecedor, nivel: row.nivel, area: row.area, serviceLine: row.serviceLine, pontos: row.ponto, requisitos: (row.requisitos || []).length, validade: row.duracaoMeses ? `${row.duracaoMeses} meses` : labels.common.semExpiracao, estado: row.ativo === false ? labels.catalog.inactive : labels.catalog.active }))
  return (
    <div>
      <PageHeader
        title={labels.catalog.title}
        subtitle={labels.catalog.subtitle}
        action={
          <ExportButtons
            data={exportRows}
            filename={isPremium ? 'talent-manager-badges-premium' : 'talent-manager-catalogo'}
            columns={isPremium ? [
              { key: "nome", label: labels.common.badge },
              { key: "descricao", label: labels.common.descricao || 'Descrição' },
              { key: "criterio", label: t('badgesGrid.premiumCriterio') },
            ] : [
              { key: "nome", label: labels.common.badge },
              { key: "fornecedor", label: labels.catalog.provider },
              { key: "nivel", label: labels.common.nivel },
              { key: "area", label: labels.common.area },
              { key: "serviceLine", label: labels.common.serviceLine },
              { key: "pontos", label: labels.common.pontos },
              { key: "requisitos", label: labels.common.requisitos },
              { key: "validade", label: labels.catalog.validity },
              { key: "estado", label: labels.common.estado },
            ]}
          />
        }
      />

      <div className="d-inline-flex rounded-3 bg-white p-1 border mb-4">
        <button
          type="button"
          onClick={() => setTipo('badges')}
          className={`btn btn-sm rounded-2 fw-medium ${!isPremium ? 'btn-brand' : 'btn-link text-muted text-decoration-none'}`}
        >
          {t('badgesGrid.badgesTab')}
        </button>
        <button
          type="button"
          onClick={() => setTipo('premium')}
          className={`btn btn-sm rounded-2 fw-medium d-inline-flex align-items-center gap-1 ${isPremium ? 'btn-brand' : 'btn-link text-muted text-decoration-none'}`}
        >
          <Crown size={14} /> {t('badgesGrid.premiumTab')}
        </button>
      </div>

      <div className="d-flex flex-wrap gap-3 mb-4">
        <div
          className="position-relative flex-grow-1"
          style={{ maxWidth: 420 }}
        >
          <Search
            size={17}
            className="position-absolute text-muted"
            style={{ left: 13, top: 11 }}
          />
          <input
            className="form-control ps-5"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={labels.catalog.search}
          />
        </div>
        {!isPremium && <>
        <select
          className="form-select"
          style={{ maxWidth: 240 }}
          value={area}
          onChange={(event) => setArea(event.target.value)}
        >
          <option value="">{labels.common.todasAreas}</option>
          {options.areas.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ maxWidth: 200 }}
          value={level}
          onChange={(event) => setLevel(event.target.value)}
        >
          <option value="">{labels.common.todosNiveis}</option>
          {options.levels.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          className="form-select"
          style={{ maxWidth: 190 }}
          value={availability}
          onChange={(event) => setAvailability(event.target.value)}
        >
          <option value="active">{labels.catalog.available}</option>
          <option value="inactive">{labels.catalog.inactive}</option>
          <option value="all">{labels.catalog.all}</option>
        </select>
        </>}
      </div>
      {loading || stale ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={isPremium ? Crown : Award}
          title={isPremium ? t('badgesGrid.premiumVazioTitulo') : labels.catalog.empty}
          description={isPremium ? t('badgesGrid.premiumVazioDesc') : labels.catalog.emptyDescription}
        />
      ) : isPremium ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
          {filtered.map((badge) => (
            <div className="col" key={badge.id}>
              <Card className="h-100">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 tint-violet-soft text-warning-emphasis"
                    style={{ width: 44, height: 44 }}
                  >
                    <Crown size={20} />
                  </div>
                  <h2 className="h6 fw-bold text-ink mb-0">{badge.nome}</h2>
                </div>
                {badge.descricao && <p className="small text-muted mb-2">{badge.descricao}</p>}
                {badge.criterio && (
                  <p className="fs-xs text-muted mb-0 mt-auto">
                    <span className="fw-medium">{t('badgesGrid.premiumCriterio')}:</span> {badge.criterio}
                  </p>
                )}
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
          {filtered.map((badge) => (
            <div className="col" key={badge.id}>
              <Link
                className="text-decoration-none"
                to={`/tm/catalogo/${badge.id}`}
              >
                <Card className="h-100">
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3 bg-brand-light text-brand fw-bold"
                      style={{ width: 48, height: 48 }}
                    >
                      {(badge.nome || "B")[0]}
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <span className="badge text-bg-light border">
                        {badge.nivel}
                      </span>
                      {badge.ativo === false && (
                        <span className="badge text-bg-secondary">
                          {labels.catalog.inactive}
                        </span>
                      )}
                    </div>
                  </div>
                  <h2 className="h6 fw-bold text-ink mt-3 mb-1">
                    {badge.nome}
                  </h2>
                  <p className="small text-muted mb-2">
                    {badge.fornecedor || badge.tipo}
                  </p>
                  <p className="fs-xs text-muted mb-3">
                    {badge.area} · {badge.serviceLine}
                  </p>
                  <div className="mt-auto d-flex justify-content-between fs-xs">
                    <span>
                      {(badge.requisitos || []).length}{" "}
                      {labels.common.requisitos.toLowerCase()}
                    </span>
                    <strong className="text-brand">
                      <Coins size={13} className="me-1" />
                      {badge.ponto || 0} {labels.common.pontos.toLowerCase()}
                    </strong>
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
