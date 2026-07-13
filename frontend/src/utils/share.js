

export function partilharLinkedin(token) {
  if (!token) return
  const url = `${window.location.origin}/badge/${token}`
  const share = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  window.open(share, '_blank', 'noopener,noreferrer')
}
