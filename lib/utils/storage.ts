import { createClient } from '@/lib/supabase/client'

export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const filePath = `users/${userId}/avatar.${fileExt}`

  // Delete old avatar if exists
  await supabase.storage.from('avatars').remove([`users/${userId}/avatar.jpg`])
  await supabase.storage.from('avatars').remove([`users/${userId}/avatar.png`])
  await supabase.storage.from('avatars').remove([`users/${userId}/avatar.webp`])

  // Upload new avatar
  const { error } = await supabase.storage.from('avatars').upload(filePath, file, {
    upsert: true,
  })

  if (error) {
    console.error('Error uploading avatar:', error)
    return null
  }

  // Get public URL with cache buster to prevent browser caching
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath)

  return `${publicUrl}?t=${Date.now()}`
}

export async function uploadOrgLogo(
  file: File,
  organizationId: string
): Promise<string | null> {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const filePath = `organizations/${organizationId}/logo.${fileExt}`

  // Delete old logo if exists
  await supabase.storage.from('avatars').remove([`organizations/${organizationId}/logo.jpg`])
  await supabase.storage.from('avatars').remove([`organizations/${organizationId}/logo.png`])
  await supabase.storage.from('avatars').remove([`organizations/${organizationId}/logo.webp`])

  // Upload new logo
  const { error } = await supabase.storage.from('avatars').upload(filePath, file, {
    upsert: true,
  })

  if (error) {
    console.error('Error uploading logo:', error)
    return null
  }

  // Get public URL with cache buster to prevent browser caching
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath)

  return `${publicUrl}?t=${Date.now()}`
}
