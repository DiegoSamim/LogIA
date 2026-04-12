import { useEffect } from 'react'
import { authService } from '@/services/auth.service'
import { useAppStore } from '@/store/useAppStore'

interface TokenPayload {
  name?: string
  full_name?: string
  given_name?: string
  username?: string
  email?: string
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=')
  return atob(padded)
}

function parseTokenPayload(token: string | null): TokenPayload | null {
  if (!token) return null

  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    return JSON.parse(decodeBase64Url(payload)) as TokenPayload
  } catch {
    return null
  }
}

function firstNonEmpty(values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? null
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0][0].toUpperCase()

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function useAuthProfile() {
  const { accessToken, currentUser, setCurrentUser } = useAppStore()

  useEffect(() => {
    if (!accessToken || currentUser) return

    let cancelled = false

    authService
      .me()
      .then(({ data }) => {
        if (!cancelled) {
          setCurrentUser(data)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [accessToken, currentUser, setCurrentUser])

  const tokenPayload = parseTokenPayload(accessToken)
  const displayName =
    firstNonEmpty([
      currentUser?.name,
      tokenPayload?.name,
      tokenPayload?.full_name,
      tokenPayload?.given_name,
      tokenPayload?.username,
      tokenPayload?.email,
    ]) ?? 'Usuário'

  const email = firstNonEmpty([currentUser?.email, tokenPayload?.email])

  return {
    currentUser,
    displayName,
    email,
    initials: getInitials(displayName),
  }
}
