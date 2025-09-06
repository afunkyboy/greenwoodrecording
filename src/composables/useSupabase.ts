import { createClient, type User, type AuthChangeEvent, type Session } from '@supabase/supabase-js'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

type UserMetadata = {
  role?: 'admin' | 'user'
  name?: string
  avatar_url?: string
}

type AppUser = User & {
  user_metadata: UserMetadata
}

type AuthResponse = {
  user: User | null
  error: string | null
}

type AuthError = {
  message: string
}

export const useSupabase = () => {
  const router = useRouter()
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const currentUser = ref<AppUser | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  // Handle auth state changes
  const handleAuthChange = async (_event: AuthChangeEvent, session: Session | null): Promise<void> => {
    if (session?.user) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Error getting user:', userError)
        currentUser.value = null
      } else {
        currentUser.value = user as AppUser
      }
    } else {
      currentUser.value = null
    }
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      isLoading.value = true
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      currentUser.value = data.user
      return { user: data.user, error: null }
    } catch (err) {
      const authError = err as AuthError
      error.value = authError.message
      return { user: null, error: authError.message }
    } finally {
      isLoading.value = false
    }
  }

  // Sign out
  const signOut = async (): Promise<{ error: Error | null }> => {
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      currentUser.value = null
      router.push('/login')
      return { error: null }
    } catch (err) {
      console.error('Error signing out:', err)
      return { error: err as Error }
    }
  }

  // Check for existing session
  const checkAuth = async (): Promise<AuthResponse> => {
    try {
      isLoading.value = true
      const { data: { session }, error: authError } = await supabase.auth.getSession()

      if (authError) throw authError

      currentUser.value = session?.user ?? null
      return { user: currentUser.value, error: null }
    } catch (err) {
      const authError = err as AuthError
      error.value = authError.message
      return { user: null, error: authError.message }
    } finally {
      isLoading.value = false
    }
  }

  // Check if user is authenticated
  const isAuthenticated = computed(() => !!currentUser.value)
  
  // Check if user is admin
  const isAdmin = computed(() => currentUser.value?.user_metadata?.role === 'admin')

  // Set up auth state listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)

  // Clean up subscription on component unmount
  onUnmounted(() => {
    subscription?.unsubscribe()
  })

  // Initial auth check
  onMounted(() => {
    checkAuth()
  })

  return {
    supabase,
    user: currentUser,
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
    signIn,
    signOut,
    checkAuth,
  }
}

// Export a singleton instance
export const supabaseClient = useSupabase()
