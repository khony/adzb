'use client'

import { useActiveOrg } from '@/contexts/active-org-context'
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats'
import { StatCard } from '@/components/dashboard/stat-card'
import { NegativeEvidencesChart } from '@/components/dashboard/negative-evidences-chart'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import {
  KeyRound,
  FileSearch,
  AlertCircle,
  Handshake,
  Tags,
  Users,
} from 'lucide-react'

export default function DashboardPage() {
  const { activeOrg } = useActiveOrg()
  const { stats, isLoading } = useDashboardStats(activeOrg?.id)

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {activeOrg?.name || 'Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          Visao geral da sua organizacao
        </p>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Palavras-chave"
              value={stats.keywordsCount}
              icon={KeyRound}
              color="blue"
              description="Total de palavras-chave cadastradas"
            />
            <StatCard
              title="Evidencias"
              value={stats.evidencesCount}
              icon={FileSearch}
              color="purple"
              description="Total de evidencias detectadas"
            />
            <StatCard
              title="Evidencias Negativas"
              value={stats.negativeEvidencesCount}
              icon={AlertCircle}
              color="red"
              description="Evidencias com resultado negativo"
            />
            <StatCard
              title="Negociacoes"
              value={stats.negotiationsCount}
              icon={Handshake}
              color="orange"
              description="Total de negociacoes em andamento"
            />
            <StatCard
              title="Categorias"
              value={stats.categoriesCount}
              icon={Tags}
              color="yellow"
              description="Categorias unicas de palavras-chave"
            />
            <StatCard
              title="Usuarios Ativos"
              value={stats.activeUsersCount}
              icon={Users}
              color="green"
              description="Membros da organizacao"
            />
          </div>

          {/* Chart */}
          <NegativeEvidencesChart data={stats.negativeEvidencesByDay} />
        </div>
      )}
    </div>
  )
}
