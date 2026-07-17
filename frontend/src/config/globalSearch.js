export function getGlobalSearchTarget(pathname, query) {
  const value = String(query || '').trim()
  if (!value) return null

  const base = `/${String(pathname || '').split('/')[1] || ''}`
  const bases = ['/tm', '/sll', '/admin']
  if (!bases.includes(base)) return null

  return `${base}/pesquisa?q=${encodeURIComponent(value)}`
}
