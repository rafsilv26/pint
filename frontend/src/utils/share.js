

export function partilharLinkedin(token) {
  if (!token) return
  const url = `${window.location.origin}/badge/${token}`
  const share = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  window.open(share, '_blank', 'noopener,noreferrer')
}

// Abre o formulário "Adicionar certificação" do LinkedIn pré-preenchido
// (secção Licenças e certificações do perfil), em vez de criar um post.
export function adicionarCertificacaoLinkedin(badge) {
  if (!badge?.publicToken) return
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: badge.nome,
    organizationName: badge.fornecedor || 'Softinsa',
    certUrl: `${window.location.origin}/badge/${badge.publicToken}`,
    certId: badge.publicToken,
  })
  const obtained = badge.obtainedDate ? new Date(badge.obtainedDate) : null
  if (obtained && !Number.isNaN(obtained.getTime())) {
    params.set('issueYear', String(obtained.getFullYear()))
    params.set('issueMonth', String(obtained.getMonth() + 1))
  }
  const expiration = badge.expirationDate ? new Date(badge.expirationDate) : null
  if (expiration && !Number.isNaN(expiration.getTime())) {
    params.set('expirationYear', String(expiration.getFullYear()))
    params.set('expirationMonth', String(expiration.getMonth() + 1))
  }
  window.open(`https://www.linkedin.com/profile/add?${params.toString()}`, '_blank', 'noopener,noreferrer')
}
