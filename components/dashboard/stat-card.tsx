import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type CardColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  description?: string
  color?: CardColor
  className?: string
}

const colorStyles: Record<CardColor, { border: string; icon: string }> = {
  blue: { border: 'border-l-blue-500', icon: 'text-blue-500' },
  green: { border: 'border-l-green-500', icon: 'text-green-500' },
  red: { border: 'border-l-red-500', icon: 'text-red-500' },
  yellow: { border: 'border-l-yellow-500', icon: 'text-yellow-500' },
  purple: { border: 'border-l-purple-500', icon: 'text-purple-500' },
  orange: { border: 'border-l-orange-500', icon: 'text-orange-500' },
}

export function StatCard({ title, value, icon: Icon, description, color, className }: StatCardProps) {
  const styles = color ? colorStyles[color] : null

  return (
    <Card className={cn(styles?.border, styles && 'border-l-4', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', styles?.icon || 'text-muted-foreground')} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
