<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBookings } from '@/composables/useBookings'
import { format } from 'date-fns'

const { bookings, loading, fetchBookings, updateBookingStatus } = useBookings()
const isLoading = ref(true)

// Filter bookings
const pendingBookings = computed(() => 
  bookings.value.filter(b => b.status === 'pending')
)

const confirmedBookings = computed(() =>
  bookings.value
    .filter(b => b.status === 'confirmed')
    .sort((a, b) => new Date(a.preferred_dates[0]).getTime() - new Date(b.preferred_dates[0]).getTime())
)

// Format date for display
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MMM d, yyyy h:mm a')
}

// Format status badge
const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Handle status update
const handleStatusUpdate = async (bookingId: string, status: 'confirmed' | 'rejected') => {
  try {
    await updateBookingStatus(bookingId, status)
    await fetchBookings()
  } catch (err) {
    console.error('Error updating booking status:', err)
  }
}

// Load data on component mount
onMounted(async () => {
  try {
    await fetchBookings()
  } catch (err) {
    console.error('Failed to load dashboard data:', err)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
      
      <div v-else>
        <!-- Pending Bookings -->
        <div class="mt-8">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Pending Approvals</h3>
          
          <div v-if="pendingBookings.length === 0" class="text-center py-8 text-gray-500">
            No pending bookings at the moment.
          </div>
          
          <div v-else class="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul class="divide-y divide-gray-200">
              <li v-for="booking in pendingBookings" :key="booking.id" class="px-6 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">{{ booking.client_name }}</p>
                    <p class="text-sm text-gray-500">{{ booking.email }} • {{ booking.phone }}</p>
                    <p class="mt-1 text-sm text-gray-500">
                      Preferred Dates: {{ booking.preferred_dates.map(d => formatDate(d)).join(', ') }}
                    </p>
                    <p class="mt-1 text-sm text-gray-500">
                      {{ booking.project_details }}
                    </p>
                  </div>
                  <div class="ml-4 flex-shrink-0 flex space-x-2">
                    <button
                      @click="handleStatusUpdate(booking.id, 'confirmed')"
                      class="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Approve
                    </button>
                    <button
                      @click="handleStatusUpdate(booking.id, 'rejected')"
                      class="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- Confirmed Bookings -->
        <div class="mt-8">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Upcoming Sessions</h3>
          
          <div v-if="confirmedBookings.length === 0" class="text-center py-8 text-gray-500">
            No upcoming sessions
          </div>
          
          <div v-else class="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul class="divide-y divide-gray-200">
              <li v-for="booking in confirmedBookings" :key="booking.id" class="px-6 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">
                      {{ booking.client_name }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ formatDate(booking.preferred_dates[0]) }}
                    </p>
                    <p class="mt-1 text-sm text-gray-500">
                      {{ booking.project_details }}
                    </p>
                  </div>
                  <div>
                    <span v-if="booking.status" :class="['px-2 py-1 text-xs font-medium rounded-full', statusBadgeClass(booking.status)]">
                      {{ booking.status }}
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
