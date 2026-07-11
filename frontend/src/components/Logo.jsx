import { useState } from 'react'

// Logótipo Softinsa. Usa a imagem em /softinsa-logo.png (fundo transparente,
// wordmark branco) e cai para o texto estilizado caso a imagem não exista.
export default function Logo({ height = 28, className = '', textClassName = 'fs-4' }) {
  const [erro, setErro] = useState(false)

  if (erro) {
    return (
      <span className={`fw-bold text-white ${textClassName}`}>
        SOFT<span className="text-info">I</span>NSA
      </span>
    )
  }

  return (
    <img
      src="/softinsa-logo.png"
      alt="Softinsa"
      className={className}
      style={{ height, width: 'auto' }}
      onError={() => setErro(true)}
    />
  )
}
