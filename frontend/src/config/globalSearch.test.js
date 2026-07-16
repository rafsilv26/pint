import { describe, expect, it } from 'vitest'
import { getGlobalSearchTarget } from './globalSearch'

describe('getGlobalSearchTarget', () => {
  it.each([
    ['/tm/candidaturas', 'Ana Silva', '/tm/pesquisa?q=Ana%20Silva'],
    ['/sll/pedidos', 'Azure', '/sll/consultores?search=Azure'],
    ['/admin/templates-email', 'admin@softinsa.pt', '/admin/utilizadores?search=admin%40softinsa.pt'],
  ])('encaminha a pesquisa de %s para a página certa', (pathname, query, expected) => {
    expect(getGlobalSearchTarget(pathname, query)).toBe(expected)
  })

  it('ignora pesquisas vazias e áreas sem pesquisa global', () => {
    expect(getGlobalSearchTarget('/admin', '   ')).toBeNull()
    expect(getGlobalSearchTarget('/catalogo', 'Azure')).toBeNull()
  })
})
