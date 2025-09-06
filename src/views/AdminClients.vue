<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const isLoading = ref(true)
const clients = ref<any[]>([])
const error = ref('')
const searchQuery = ref('')

const fetchClients = async () => {
  try {
    isLoading.value = true
    let query = supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true })

    if (searchQuery.value) {
      query = query.ilike('name', `%${searchQuery.value}%`)
    }

    const { data, error: fetchError } = await query
    
    if (fetchError) throw fetchError
    
    clients.value = data || []
  } catch (err) {
    console.error('Error fetching clients:', err)
    error.value = 'Failed to load clients. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const viewClient = (id: string) => {
  router.push(`/admin/clients/${id}`)
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

const getInitials = (name: string) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

onMounted(() => {
  fetchClients()
})
</script>

<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Search and Filter -->
      <div class="mt-6 flex justify-between items-center">
        <div class="relative w-64">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Search clients..."
            @input="fetchClients"
          >
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="isLoading" class="mt-8 p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
        <p class="mt-2 text-sm text-gray-500">Loading clients...</p>
      </div>

      <!-- Clients List -->
      <div v-else class="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
        <ul class="divide-y divide-gray-200">
          <li v-for="client in clients" :key="client.id">
            <div class="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer" @click="viewClient(client.id)">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span class="text-green-600 font-medium">{{ getInitials(client.name) }}</span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-green-600 truncate">{{ client.name || 'No name' }}</div>
                    <div class="flex items-center text-sm text-gray-500">
                      <span v-if="client.email" class="truncate">{{ client.email }}</span>
                      <span v-if="client.email && client.phone" class="mx-1">•</span>
                      <span v-if="client.phone">{{ client.phone }}</span>
                    </div>
                  </div>
                </div>
                <div class="ml-2 flex-shrink-0 flex">
                  <div class="text-right">
                    <div class="text-sm text-gray-500">
                      Member since {{ formatDate(client.created_at) }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ client.booking_count || 0 }} {{ client.booking_count === 1 ? 'booking' : 'bookings' }}
                    </div>
                  </div>
                  <svg class="ml-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </li>
          <li v-if="clients.length === 0" class="px-4 py-4 sm:px-6 text-center text-sm text-gray-500">
            No clients found
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
