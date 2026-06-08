import { useState } from 'react'

// Logótipo Softinsa. Usa a imagem em /softinsa-logo.png (fundo transparente,
// wordmark branco) e cai para o texto estilizado caso a imagem não exista.
export default function Logo({ className = 'h-7 w-auto', textClassName = 'text-xl' }) {
  const [erro, setErro] = useState(false)

  if (erro) {
    return (
      <span className={`font-extrabold tracking-tight text-white ${textClassName}`}>
        SOFT<span className="text-cyan-300">I</span>NSA
      </span>
    )
  }

  return (
    <img
      src="/softinsa-logo.png"
      alt="Softinsa"
      className={className}
      onError={() => setErro(true)}
    />
  )
}
