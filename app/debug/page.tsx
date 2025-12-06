import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DebugPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check organizations
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*')

  // Check organization_members
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select('*')
    .eq('user_id', user.id)

  // Check with join
  const { data: joinData, error: joinError } = await supabase
    .from('organization_members')
    .select(
      `
      role,
      organization:organizations(*)
    `
    )
    .eq('user_id', user.id)

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>

      <div className="space-y-6">
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Current User</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(
              {
                id: user.id,
                email: user.email,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">All Organizations</h2>
          <p className="text-sm text-gray-600">
            Total: {orgs?.length || 0} | Error: {orgsError ? 'Yes' : 'No'}
          </p>
          {orgsError && (
            <pre className="text-xs bg-red-100 p-2 rounded overflow-auto mt-2">
              {JSON.stringify(orgsError, null, 2)}
            </pre>
          )}
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto mt-2">
            {JSON.stringify(orgs, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">My Organization Memberships</h2>
          <p className="text-sm text-gray-600">
            Total: {members?.length || 0} | Error: {membersError ? 'Yes' : 'No'}
          </p>
          {membersError && (
            <pre className="text-xs bg-red-100 p-2 rounded overflow-auto mt-2">
              {JSON.stringify(membersError, null, 2)}
            </pre>
          )}
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto mt-2">
            {JSON.stringify(members, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Join Query (Same as hook)</h2>
          <p className="text-sm text-gray-600">
            Total: {joinData?.length || 0} | Error: {joinError ? 'Yes' : 'No'}
          </p>
          {joinError && (
            <pre className="text-xs bg-red-100 p-2 rounded overflow-auto mt-2">
              {JSON.stringify(joinError, null, 2)}
            </pre>
          )}
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto mt-2">
            {JSON.stringify(joinData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
