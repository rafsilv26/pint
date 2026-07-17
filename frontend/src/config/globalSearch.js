export function getGlobalSearchTarget(pathname, query) {
  const value = String(query || '').trim()
  if (!value) return null

  const base = `/${String(pathname || '').split('/')[1] || ''}`
  const targets = {
    '/tm': { pathname: '/tm/pesquisa', key: 'q' },
    '/sll': { pathname: '/sll/consultores', key: 'search' },
    '/admin': { pathname: '/admin/utilizadores', key: 'search' },
  }
  const target = targets[base]
  if (!target) return null

  return `${target.pathname}?${target.key}=${encodeURIComponent(value)}`
}
