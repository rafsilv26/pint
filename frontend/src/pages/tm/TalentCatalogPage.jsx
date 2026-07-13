import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Coins, Search } from 'lucide-react'
import { Card, EmptyState, ErrorState, PageHeader, Spinner } from '../../components/ui'
import ExportButtons from '../../components/ExportButtons'
import { useAsync } from '../../hooks/useAsync'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as api from '../../services/api'
import { useTranslation } from 'react-i18next'

export default function TalentCatalogPage() {
  const { t } = useTranslation()
  const labels = t('tmWorkspace', { returnObjects: true })
  const { data, loading, error, reload } = useAsync(() => api.getTalentCatalog())
  useAutoRefresh(reload)
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [level, setLevel] = useState('')
  const [availability, setAvailability] = useState('active')
  const rows = useMemo(() => data || [], [data])
  const options = useMemo(() => ({ areas: [...new Set(rows.map((row) => row.area).filter(Boolean))].sort(), levels: [...new Set(rows.map((row) => row.nivel).filter(Boolean))].sort() }), [rows])
  const filtered = rows.filter((row) =>
    (!area || row.area === area) &&
    (!level || row.nivel === level) &&
    (availability === 'all' || (availability === 'active' ? row.ativo !== false : row.ativo === false)) &&
    `${row.nome} ${row.fornecedor} ${row.area} ${row.serviceLine}`.toLowerCase().includes(search.toLowerCase())
  )
  const exportRows = filtered.map((row) => ({ nome: row.nome, fornecedor: row.fornecedor, nivel: row.nivel, area: row.area, serviceLine: row.serviceLine, pontos: row.ponto, requisitos: row.requisitos.length, validade: row.duracaoMeses ? `${row.duracaoMeses} meses` : labels.common.semExpiracao, estado: row.ativo === false ? labels.catalog.inactive : labels.catalog.active }))
  return (
    <div>
      <PageHeader
        title={labels.catalog.title}
        subtitle={labels.catalog.subtitle}
        action={
          <ExportButtons
            data={exportRows}
            filename="talent-manager-catalogo"
            columns={[
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
      </div>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Award}
          title={labels.catalog.empty}
          description={labels.catalog.emptyDescription}
        />
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
                      {badge.requisitos.length}{" "}
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
