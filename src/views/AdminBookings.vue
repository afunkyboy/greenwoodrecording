<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const isLoading = ref(true)
const bookings = ref([])
const error = ref('')

const fetchBookings = async () => {
  try {
    isLoading.value = true
    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        clients:client_id (id, name, email, phone)
      `)
      .order('start_time', { ascending: false })

    if (fetchError) throw fetchError
    
    bookings.value = data || []
  } catch (err) {
    console.error('Error fetching bookings:', err)
    error.value = 'Failed to load bookings. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const viewBooking = (id) => {
  router.push(`/admin/bookings/${id}`)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const getStatusBadgeClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  fetchBookings()
})
</script>

<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div v-if="error" class="rounded-md bg-red-50 p-4 mt-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              {{ error }}
            </h3>
          </div>
        </div>
      </div>

      <div class="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Recent Bookings
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">
            All booking requests and their current status
          </p>
        </div>
        
        <div v-if="isLoading" class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
          <p class="mt-2 text-sm text-gray-500">Loading bookings...</p>
        </div>

        <div v-else class="overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" class="relative px-6 py-3">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="booking in bookings" :key="booking.id" class="hover:bg-gray-50 cursor-pointer" @click="viewBooking(booking.id)">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span class="text-green-600 font-medium">{{ booking.clients?.name?.charAt(0) || '?' }}</span>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ booking.clients?.name || 'No name' }}</div>
                      <div class="text-sm text-gray-500">{{ booking.clients?.email || booking.clients?.phone || 'No contact' }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ booking.service_type || 'N/A' }}</div>
                  <div class="text-sm text-gray-500">{{ booking.duration || 0 }} minutes</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ formatDate(booking.start_time) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="[getStatusBadgeClass(booking.status), 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize']">
                    {{ booking.status || 'unknown' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button class="text-green-600 hover:text-green-900">View</button>
                </td>
              </tr>
              <tr v-if="bookings.length === 0">
                <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                  No bookings found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
