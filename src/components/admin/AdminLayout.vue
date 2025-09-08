<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminNavigation from './AdminNavigation.vue'

const route = useRoute()
const showBackButton = computed(() => {
  // Always show back button unless we're exactly on the dashboard
  return route.path !== '/admin' && route.path.startsWith('/admin')
})

const router = useRouter()
const isSidebarOpen = ref(false)
const userInitials = 'A' // Admin initial

const handleSignOut = () => {
  localStorage.removeItem('isAuthenticated')
  router.push('/login')
}

// Close mobile menu when route changes
const closeMobileMenu = () => {
  if (window.innerWidth < 1024) {
    isSidebarOpen.value = false
  }
}

// Close mobile menu on route change
onMounted(() => {
  router.afterEach(closeMobileMenu)
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Mobile sidebar -->
    <div class="lg:hidden">
      <div :class="['fixed inset-0 flex z-40', { 'hidden': !isSidebarOpen }]">
        <div class="fixed inset-0" @click="isSidebarOpen = false">
          <div class="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
        <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div class="absolute top-0 right-0 -mr-14 p-1">
            <button
              @click="isSidebarOpen = false"
              class="flex items-center justify-center h-12 w-12 rounded-full focus:outline-none focus:bg-gray-600"
              aria-label="Close sidebar"
            >
              <svg class="h-6 w-6 text-white" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div class="flex-shrink-0 flex items-center px-4">
              <h1 class="text-xl font-bold text-green-700">Greenwood Studio</h1>
            </div>
            <div class="mt-5 px-2">
              <AdminNavigation />
            </div>
          </div>
          <div class="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div class="flex items-center">
              <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <span class="text-green-600 font-medium">{{ userInitials }}</span>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-700">
                  Admin
                </p>
                <button
                  @click="handleSignOut"
                  class="text-xs font-medium text-red-600 hover:text-red-800"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Static sidebar for desktop -->
    <div class="hidden lg:flex lg:flex-shrink-0">
      <div class="flex flex-col w-64 border-r border-gray-200 bg-gray-50">
        <div class="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 class="text-xl font-bold text-green-700">Greenwood Studio</h1>
        </div>
        <div class="flex-1 flex flex-col overflow-y-auto">
          <div class="px-3 py-4">
            <AdminNavigation />
          </div>
        </div>
        <div class="p-4 border-t border-gray-200">
          <div class="flex items-center">
            <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <span class="text-green-600 font-medium">{{ userInitials }}</span>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-700">
                Admin
              </p>
              <button
                @click="handleSignOut"
                class="text-xs font-medium text-red-600 hover:text-red-800"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 overflow-auto focus:outline-none">
      <!-- Top navigation with back button -->
      <div class="bg-white shadow-sm">
        <div class="px-4 py-3 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between">
            <!-- Back button (shown on all pages except dashboard) -->
            <div v-if="showBackButton">
              <router-link 
                to="/admin" 
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg class="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </router-link>
            </div>
            <div v-else class="flex-1"></div>
            
            <!-- Mobile menu button and actions -->
            <div class="flex items-center">
              <div class="lg:hidden ml-4">
                <button
                  @click="isSidebarOpen = true"
                  class="text-gray-500 hover:text-gray-600 focus:outline-none"
                >
                  <span class="sr-only">Open sidebar</span>
                  <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <div class="hidden md:block ml-4">
                <slot name="actions"></slot>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Page title centered above content -->
        <div class="border-t border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900">
              <slot name="header">
                {{ $route.meta.title || 'Dashboard' }}
              </slot>
            </h1>
            <p v-if="$slots.subtitle || $route.meta.subtitle" class="mt-1 text-sm text-gray-500">
              <slot name="subtitle">
                {{ $route.meta.subtitle }}
              </slot>
            </p>
          </div>
        </div>
      </div>

      <!-- Page content -->
      <main class="flex-1 relative pb-8 z-0 overflow-y-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>
