<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isCheckingAuth = ref(true)
const authError = ref(null)

// Check if user is authenticated
const isAuthenticated = () => {
  return localStorage.getItem('isAuthenticated') === 'true'
}

// Check auth and permissions when the component is mounted
onMounted(() => {
  checkAuthAndPermissions()
})

// Watch for route changes to re-check auth and permissions
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath) {
      checkAuthAndPermissions()
    }
  }
)

const checkAuthAndPermissions = () => {
  isCheckingAuth.value = true
  authError.value = null
  
  try {
    // If route requires authentication and user is not authenticated
    if (route.meta.requiresAuth && !isAuthenticated()) {
      authError.value = 'You need to be logged in to access this page.'
      router.push({ 
        path: '/login',
        query: { redirect: route.fullPath }
      })
      return
    }
    
    // If route requires admin, we'll just check authentication
    // since we're using a simple password system
    if (route.meta.requiresAdmin && !isAuthenticated()) {
      authError.value = 'You do not have permission to access this page.'
      router.push('/')
      return
    }
  } catch (error) {
    authError.value = 'An error occurred while checking your permissions.'
    router.push('/')
  } finally {
    isCheckingAuth.value = false
  }
}
</script>

<template>
  <div v-if="isCheckingAuth" class="flex flex-col items-center justify-center min-h-screen space-y-4">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    <p class="text-gray-600">Checking authentication...</p>
  </div>
  <div v-else-if="authError" class="flex flex-col items-center justify-center min-h-screen p-4">
    <div class="bg-red-50 border-l-4 border-red-400 p-4 w-full max-w-md">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ authError }}</p>
          <div class="mt-4">
            <router-link
              v-if="authError.includes('logged in')"
              :to="{ path: '/login', query: { redirect: $route.fullPath } }"
              class="text-sm font-medium text-red-700 hover:text-red-600 transition duration-150 ease-in-out"
            >
              Go to login →
            </router-link>
            <router-link
              v-else
              to="/"
              class="text-sm font-medium text-red-700 hover:text-red-600 transition duration-150 ease-in-out"
            >
              Back to home →
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
  <router-view v-else />
</template>
