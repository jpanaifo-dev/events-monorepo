import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { StateStorage } from "zustand/middleware"
import type { AuthState, User, Organization } from "../types/auth.types"
import * as jose from "jose"

let keyUint8: Uint8Array | null = null

async function getEncryptionKey(): Promise<Uint8Array> {
  if (keyUint8) return keyUint8
  const secret = new TextEncoder().encode(
    (import.meta.env.VITE_COOKIE_SECRET as string) || "fallback_gesti_secret_key_32_bytes"
  )
  const hashed = await crypto.subtle.digest("SHA-256", secret)
  keyUint8 = new Uint8Array(hashed)
  return keyUint8
}

async function encrypt(text: string): Promise<string> {
  const key = await getEncryptionKey()
  const data = new TextEncoder().encode(text)
  const jwe = await new jose.CompactEncrypt(data)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(key)
  return jwe
}

async function decrypt(jwe: string): Promise<string> {
  try {
    const key = await getEncryptionKey()
    const { plaintext } = await jose.compactDecrypt(jwe, key)
    return new TextDecoder().decode(plaintext)
  } catch (e) {
    console.error("Error decrypting cookie:", e)
    return ""
  }
}

// Custom cookie storage for Zustand using Jose JWE
const cookieStorage: StateStorage = {
  getItem: async (name): Promise<string | null> => {
    const cookies = document.cookie.split("; ")
    const cookie = cookies.find((row) => row.startsWith(`${name}=`))
    if (!cookie) return null
    const val = cookie.split("=")[1]
    const decrypted = await decrypt(val)
    return decrypted || null
  },
  setItem: async (name, value): Promise<void> => {
    const encrypted = await encrypt(value)
    const date = new Date()
    date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days expiration
    document.cookie = `${name}=${encrypted}; expires=${date.toUTCString()}; path=/; SameSite=Strict; Secure`
  },
  removeItem: async (name): Promise<void> => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure`
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organizations: [],
      selectedOrganization: null,
      isAuthenticated: false,
      isProfileComplete: false,
      isLoading: true,

      login: (user: User, organizations: Organization[]) =>
        set({
          user,
          organizations,
          selectedOrganization: organizations.length > 0 ? organizations[0] : null,
          isAuthenticated: true,
          isProfileComplete: !!(user.full_name && user.phone),
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          organizations: [],
          selectedOrganization: null,
          isAuthenticated: false,
          isProfileComplete: false,
          isLoading: false,
        }),

      selectOrganization: (organization: Organization | null) =>
        set({
          selectedOrganization: organization,
        }),

      setProfileComplete: (isComplete: boolean) =>
        set({
          isProfileComplete: isComplete,
        }),

      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: !!user,
          isProfileComplete: user ? !!(user.full_name && user.phone) : false,
        }),

      setLoading: (isLoading: boolean) =>
        set({
          isLoading,
        }),

      setOrganizations: (organizations: Organization[]) =>
        set((state) => ({
          organizations,
          selectedOrganization: state.selectedOrganization 
            ? (organizations.find((s) => s.id === state.selectedOrganization?.id) || null) 
            : (organizations.length > 0 ? organizations[0] : null),
        })),
    }),
    {
      name: "saas-auth-storage",
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({
        user: state.user,
        organizations: state.organizations,
        selectedOrganization: state.selectedOrganization,
        isAuthenticated: state.isAuthenticated,
        isProfileComplete: state.isProfileComplete,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setLoading(false)
        }
      },
    }
  )
)
