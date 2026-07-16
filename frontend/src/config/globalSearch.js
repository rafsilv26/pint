export function getGlobalSearchTarget(pathname, query) {
  const value = String(query || '').trim()
  if (!value) return null

  const base = `/${String(pathname || '').split('/')[1] || ''}`
  // Todos os perfis de gestão vão para a mesma página de pesquisa global
  // (consultores + badges + candidaturas), específica do seu prefixo de rota.
  const bases = ['/tm', '/sll', '/admin']
  if (!bases.includes(base)) return null

  return `${base}/pesquisa?q=${encodeURIComponent(value)}`
}
