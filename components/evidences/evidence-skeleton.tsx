import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function EvidenceRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="hidden lg:block h-5 w-16 rounded-full" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex gap-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Skeleton className="h-4 w-36" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-8 ml-auto" />
      </TableCell>
    </TableRow>
  )
}

export function EvidenceListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead>Palavra-chave</TableHead>
              <TableHead className="hidden md:table-cell">Tags</TableHead>
              <TableHead className="hidden sm:table-cell">Detectado em</TableHead>
              <TableHead className="w-[80px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <EvidenceRowSkeleton key={index} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
