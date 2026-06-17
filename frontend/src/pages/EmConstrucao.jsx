import { Hammer } from 'lucide-react'
import { PageHeader, Card } from '../components/ui'

// Placeholder para secções ainda por construir (mantém a navegação funcional).
export default function EmConstrucao({ titulo = 'Em construção' }) {
  return (
    <div>
      <PageHeader title={titulo} />
      <Card className="flex flex-col items-center justify-center py-12 text-center">
        <Hammer size={36} className="mb-3 text-gray-400" />
        <p className="font-semibold text-ink">Esta secção está a ser construída.</p>
        <p className="mt-1 text-sm text-muted">Em breve disponível.</p>
      </Card>
    </div>
  )
}
