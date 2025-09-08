<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { useNotifications } from '@/composables/useNotifications'
import NotificationCenter from '@/components/NotificationCenter.vue'

const title = import.meta.env.VITE_APP_TITLE || 'Greenwood Recording Studio'
const { checkAuth } = useSupabase()
const { addNotification } = useNotifications()

// Check auth status when app loads
onMounted(async () => {
  try {
    await checkAuth()
  } catch (error) {
    addNotification('error', 'Failed to initialize authentication')
    console.error('Auth initialization error:', error)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Notification Center -->
    <NotificationCenter />
    
    <!-- Header -->
    <header class="bg-green-900 text-white shadow-md">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold">
              <router-link to="/" class="hover:text-green-200">{{ title }}</router-link>
            </h1>
            <p class="mt-2 text-green-200">Book your recording session today</p>
          </div>
          <nav>
            <router-link 
              to="/admin" 
              class="text-sm font-medium text-white hover:text-green-200"
              v-if="$route.path !== '/admin'"
            >
              Admin Login
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <RouterView />
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white mt-12 border-t border-gray-200">
      <div class="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
        <p class="text-center text-base text-gray-500">
          &copy; {{ new Date().getFullYear() }} {{ title }}. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<style>
.router-link-active {
  @apply font-semibold;
}

/* Main content styles */
main {
  min-height: 50vh;
  background-color: #f8f9fa;
}
</style>
