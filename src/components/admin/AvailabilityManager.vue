<script setup>
import { ref, onMounted } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { format, parseISO, addDays } from 'date-fns'

const { supabase } = useSupabase()
const loading = ref(false)
const error = ref('')
const success = ref('')

// Form data
const date = ref('')
const startTime = ref('09:00')
const endTime = ref('17:00')
const maxBookings = ref(1)
const isRecurring = ref(false)
const recurringDays = ref(7)

// Available slots
const availabilitySlots = ref([])

// Fetch availability slots
const fetchAvailability = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const { data, error: fetchError } = await supabase
      .from('availability')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (fetchError) throw fetchError
    
    availabilitySlots.value = data || []
  } catch (err) {
    console.error('Error fetching availability:', err)
    error.value = 'Failed to load availability slots'
  } finally {
    loading.value = false
  }
}

// Add new availability slot(s)
const addAvailability = async () => {
  try {
    if (!date.value) {
      error.value = 'Please select a date'
      return
    }
    
    loading.value = true
    error.value = ''
    success.value = ''
    
    const baseDate = new Date(date.value)
    const slotsToAdd = []
    
    // Create slots for each day in the recurring period if enabled
    const daysToAdd = isRecurring.value ? recurringDays.value : 1
    
    for (let i = 0; i < daysToAdd; i++) {
      const currentDate = addDays(baseDate, i)
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      
      // Skip weekends
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue
      
      slotsToAdd.push({
        date: dateStr,
        start_time: startTime.value,
        end_time: endTime.value,
        max_bookings: maxBookings.value,
        current_bookings: 0,
        is_available: true
      })
    }
    
    if (slotsToAdd.length === 0) {
      error.value = 'No valid dates to add (weekends are skipped)'
      return
    }
    
    const { data, error: insertError } = await supabase
      .from('availability')
      .insert(slotsToAdd)
      .select()
    
    if (insertError) throw insertError
    
    success.value = `Added ${data?.length || 0} availability slots`
    await fetchAvailability()
    
    // Reset form
    if (!isRecurring.value) {
      date.value = ''
    }
    
  } catch (err) {
    console.error('Error adding availability:', err)
    error.value = 'Failed to add availability slots'
  } finally {
    loading.value = false
  }
}

// Toggle availability of a slot
const toggleAvailability = async (slot) => {
  try {
    loading.value = true
    error.value = ''
    
    const { error: updateError } = await supabase
      .from('availability')
      .update({ is_available: !slot.is_available })
      .eq('id', slot.id)
    
    if (updateError) throw updateError
    
    await fetchAvailability()
  } catch (err) {
    console.error('Error toggling availability:', err)
    error.value = 'Failed to update availability'
  } finally {
    loading.value = false
  }
}

// Delete a slot
const deleteSlot = async (id) => {
  if (!confirm('Are you sure you want to delete this availability slot?')) return
  
  try {
    loading.value = true
    error.value = ''
    
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('id', id)
    
    if (deleteError) throw deleteError
    
    await fetchAvailability()
  } catch (err) {
    console.error('Error deleting slot:', err)
    error.value = 'Failed to delete availability slot'
  } finally {
    loading.value = false
  }
}

// Format date for display
const formatDate = (dateStr) => {
  return format(parseISO(dateStr), 'EEE, MMM d, yyyy')
}

// Format time for display
const formatTime = (timeStr) => {
  return format(parseISO(`2000-01-01T${timeStr}`), 'h:mm a')
}

// Initialize
onMounted(() => {
  // Set default date to today
  date.value = format(new Date(), 'yyyy-MM-dd')
  fetchAvailability()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-medium text-gray-900">Manage Availability</h2>
      <p class="mt-1 text-sm text-gray-500">Add and manage time slots when the studio is available for bookings.</p>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">{{ error }}</h3>
        </div>
      </div>
    </div>

    <div v-if="success" class="rounded-md bg-green-50 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-green-800">{{ success }}</p>
        </div>
      </div>
    </div>

    <!-- Add Availability Form -->
    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-base font-semibold leading-6 text-gray-900">Add Availability</h3>
        <div class="mt-5">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label for="date" class="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                id="date"
                v-model="date"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                :min="format(new Date(), 'yyyy-MM-dd')"
                required
              />
            </div>
            
            <div class="flex items-end space-x-4">
              <div class="flex-1">
                <label for="start-time" class="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="time"
                  id="start-time"
                  v-model="startTime"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  required
                />
              </div>
              <div class="flex-1">
                <label for="end-time" class="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="time"
                  id="end-time"
                  v-model="endTime"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label for="max-bookings" class="block text-sm font-medium text-gray-700">Max Bookings</label>
              <input
                type="number"
                id="max-bookings"
                v-model.number="maxBookings"
                min="1"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                required
              />
            </div>
            
            <div class="flex items-end space-x-4">
              <div class="flex items-center">
                <input
                  id="recurring"
                  v-model="isRecurring"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label for="recurring" class="ml-2 block text-sm text-gray-700">
                  Recurring for
                </label>
              </div>
              <div class="flex-1">
                <input
                  type="number"
                  v-model.number="recurringDays"
                  :disabled="!isRecurring"
                  min="1"
                  max="30"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 disabled:bg-gray-50 sm:text-sm"
                />
              </div>
              <span class="text-sm text-gray-500">days</span>
            </div>
          </div>
          
          <div class="mt-5">
            <button
              type="button"
              @click="addAvailability"
              :disabled="loading"
              class="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <svg v-if="loading" class="-ml-1 mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isRecurring ? 'Add Recurring Slots' : 'Add Availability' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Current Availability -->
    <div class="mt-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h3 class="text-base font-semibold leading-6 text-gray-900">Current Availability</h3>
          <p class="mt-2 text-sm text-gray-700">A list of all available time slots in the system.</p>
        </div>
      </div>
      
      <div class="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <div v-if="loading && availabilitySlots.length === 0" class="flex justify-center p-8">
          <div class="h-6 w-6 animate-spin rounded-full border-b-2 border-green-600"></div>
        </div>
        
        <div v-else-if="availabilitySlots.length === 0" class="bg-white p-6 text-center text-sm text-gray-500">
          No availability slots found. Add some using the form above.
        </div>
        
        <div v-else class="overflow-x-auto bg-white">
          <table class="min-w-full divide-y divide-gray-300">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Time</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Availability</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Bookings</th>
                <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="slot in availabilitySlots" :key="slot.id">
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  {{ formatDate(slot.date) }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {{ formatTime(slot.start_time) }} - {{ formatTime(slot.end_time) }}
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm">
                  <span 
                    :class="{
                      'bg-green-100 text-green-800': slot.is_available,
                      'bg-red-100 text-red-800': !slot.is_available
                    }"
                    class="inline-flex rounded-full px-2 text-xs font-semibold leading-5"
                  >
                    {{ slot.is_available ? 'Available' : 'Unavailable' }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {{ slot.current_bookings }} / {{ slot.max_bookings }}
                </td>
                <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    @click="toggleAvailability(slot)"
                    class="text-green-600 hover:text-green-900 mr-4"
                    :disabled="loading"
                  >
                    {{ slot.is_available ? 'Mark Unavailable' : 'Mark Available' }}
                  </button>
                  <button
                    @click="deleteSlot(slot.id)"
                    class="text-red-600 hover:text-red-900"
                    :disabled="loading"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
