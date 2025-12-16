import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Toaster } from '@/components/ui/toaster'
import { DashboardProvider } from '@/components/providers/dashboard-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <DashboardProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={profile} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <Toaster />
      </div>
    </DashboardProvider>
  )
}
