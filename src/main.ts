import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import { supabaseClient } from '@/composables/useSupabase'
import router from './router'
import App from './App.vue'
import './assets/tailwind.css'

// Initialize the app
const app = createApp(App)
const pinia = createPinia()
const head = createHead()

// Register global components
// app.component('Icon', Icon)

// Use plugins
app.use(pinia)
app.use(router)
app.use(head)

// Global error handler
app.config.errorHandler = (err) => {
  console.error('Global error:', err)
  // You could add a notification here if needed
}

// Global properties
app.config.globalProperties.$supabase = supabaseClient

// Mount the app
app.mount('#app')

// Handle auth state changes
supabaseClient.supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && router.currentRoute.value.meta.requiresAuth) {
    router.push('/login')
  }
})
