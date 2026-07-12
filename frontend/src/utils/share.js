// Partilha de um badge no LinkedIn. Abre o diálogo de partilha do LinkedIn
// apontando para a página pública do badge (prova verificável da certificação).
export function partilharLinkedin(token) {
  if (!token) return
  const url = `${window.location.origin}/badge/${token}`
  const share = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  window.open(share, '_blank', 'noopener,noreferrer')
}
