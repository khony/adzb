'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NegativeEvidencesChartProps {
  data: { date: string; count: number }[]
}

export function NegativeEvidencesChart({ data }: NegativeEvidencesChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    dateLabel: format(parseISO(item.date), 'dd/MM', { locale: ptBR }),
    dayName: format(parseISO(item.date), 'EEE', { locale: ptBR }),
  }))

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Evidencias Negativas</CardTitle>
        <CardDescription>Quantidade de evidencias negativas nos ultimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                className="text-muted-foreground"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-1">
                          <div className="text-xs text-muted-foreground capitalize">
                            {format(parseISO(data.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                            <span className="text-sm font-bold">
                              {data.count} evidencia{data.count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
