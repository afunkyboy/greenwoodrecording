<script setup>
import { ref, computed, watch } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { useBookings } from '@/composables/useBookings'
import { 
  format, 
  isToday, 
  isPast, 
  isSameDay, 
  isSameMonth, 
  getDaysInMonth,
  isWeekend
} from 'date-fns'
import { useToast } from 'vue-toastification'

// Calendar state
const currentDate = ref(new Date())
const selectedDate = ref(null)
const view = ref('month')
const availableViews = ['month', 'week', 'day']
const dragOverDate = ref(null)
const isDragging = ref(false)

// Helper function to safely access date properties
const getDateValue = (date) => ({
  year: date.getFullYear(),
  month: date.getMonth(),
  day: date.getDate(),
  dayOfWeek: date.getDay()
})

// Computed properties
const daysInMonth = computed(() => {
  const { year, month } = getDateValue(currentDate.value)
  const days = getDaysInMonth(new Date(year, month))
  
  return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1))
})

// Calculate empty cells for the first week
const emptyDays = computed(() => {
  const { year, month } = getDateValue(currentDate.value)
  return new Date(year, month, 1).getDay()
})

// Format month and year for display
const currentMonthName = computed(() => format(currentDate.value, 'MMMM yyyy'))

// Get the first day of the current month view
const firstDayOfMonth = computed(() => {
  const date = new Date(currentDate.value)
  return new Date(date.getFullYear(), date.getMonth(), 1)
})

// Get the last day of the current month view
const lastDayOfMonth = computed(() => {
  const date = new Date(currentDate.value)
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
})

// Get day names for the calendar header
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Booking data
const bookings = ref([])
const isLoading = ref(true)
const error = ref('')
const selectedBooking = ref(null)
const showBookingModal = ref(false)
const isEditing = ref(false)

// UI State
const draggedBooking = ref(null)

// Calendar navigation
const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  )
  fetchBookings()
}

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
  fetchBookings()
}

// Format time for display
const formatTime = (date) => {
  if (!date) return ''
  return format(new Date(date), 'h:mm a')
}

// Check if a day has any bookings
const hasBookings = (day) => {
  return bookings.value.some(booking => {
    const bookingDate = booking.confirmed_date || booking.preferred_dates?.[0]
    return bookingDate && isSameDay(new Date(bookingDate), day)
  })
}

function getBookingsForDay(day) {
  if (!day) return []
  
  return bookings.value.filter(booking => {
    try {
      const bookingDate = booking.confirmed_date || booking.preferred_dates?.[0]
      if (!bookingDate) return false
      
      const bookingDateObj = new Date(bookingDate)
      return isSameDay(bookingDateObj, day)
    } catch (error) {
      console.error('Error processing booking date:', error)
      return false
    }
  })
}

const { supabase } = useSupabase()
const { updateBooking } = useBookings()
const toast = useToast()

// Computed properties
const formattedBookings = computed(() => {
  return bookings.value.map(booking => ({
    key: booking.id,
    dates: new Date(booking.confirmed_date || booking.preferred_dates?.[0] || new Date()),
    dot: {
      color: getStatusColor(booking.status),
      class: 'opacity-75'
    },
    popover: {
      label: `${booking.client_name || 'Client'}: ${booking.project_details?.substring(0, 30) || 'No details'}...`,
      visibility: 'hover'
    },
    customData: booking
  }))
})

// Methods
const getStatusColor = (status) => {
  const statusLower = status?.toLowerCase() || ''
  switch (statusLower) {
    case 'confirmed': return 'green'
    case 'pending': return 'yellow'
    case 'cancelled': 
    case 'rejected': 
      return 'red'
    default: return 'blue'
  }
}

const handleDayClick = (day) => {
  selectedDate.value = day.date
  view.value = 'day'
}

const handleEventClick = (event) => {
  selectedBooking.value = event.event.customData
  showBookingModal.value = true
}

async function fetchBookings() {
  try {
    isLoading.value = true
    
    // Format dates for the query
    const start = format(firstDayOfMonth.value, 'yyyy-MM-dd')
    const end = format(lastDayOfMonth.value, 'yyyy-MM-dd')
    
    // Reset error state
    error.value = ''
    
    // Fetch bookings for the current month view
    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id,
        client_id,
        status,
        confirmed_date,
        notes,
        project_details,
        preferred_dates,
        created_at,
        updated_at,
        clients (
          id,
          name,
          email,
          phone,
          created_at,
          updated_at
        )
      `)
      .or(`confirmed_date.gte.${start}T00:00:00,preferred_dates.cs.{"${start}"}`)
      .lte('confirmed_date', `${end}T23:59:59`)
      .order('confirmed_date', { ascending: true })
    
    if (fetchError) throw fetchError
    
    // Process the data to include client info
    if (data) {
      bookings.value = data.map(booking => {
        const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients
        const bookingDate = booking.confirmed_date || booking.preferred_dates?.[0]
        const bookingDateObj = bookingDate ? new Date(bookingDate) : null
        const bookingDateStr = bookingDateObj ? bookingDateObj.toISOString() : ''
        
        return {
          ...booking,
          client_name: client?.name || 'Unknown',
          client_email: client?.email || '',
          client_phone: client?.phone || '',
          display_date: bookingDateObj ? format(bookingDateObj, 'MMM d, yyyy h:mm a') : 'Date not set',
          booking_date: bookingDateStr,
          start_time: bookingDateStr,
          end_time: bookingDateObj ? new Date(bookingDateObj.getTime() + 60 * 60 * 1000).toISOString() : null
        }
      })
    }
  } catch (err) {
    console.error('Error fetching bookings:', err)
    error.value = 'Failed to load bookings. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Removed duplicate getBookingsForDay function

// Removed unused changeMonth function as we have previousMonth and nextMonth

// Drag and drop handlers
function onDragStart(booking) {
  draggedBooking.value = booking
  isDragging.value = true
  document.body.style.cursor = 'grabbing'
}

function onDragEnd() {
  isDragging.value = false
  dragOverDate.value = null
  document.body.style.cursor = ''
}

function onDragOver(event, day) {
  event.preventDefault()
  if (isPast(day) && !isToday(day)) return
  dragOverDate.value = day
}

function onDragLeave() {
  dragOverDate.value = null
}

async function onDrop(event, day) {
  event.preventDefault()
  
  if (!draggedBooking.value || (isPast(day) && !isToday(day))) {
    dragOverDate.value = null
    return
  }

  try {
    isLoading.value = true
    
    const oldDate = new Date(draggedBooking.value.confirmed_date || day)
    const newDate = new Date(day)
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes())
    
    const { data: existingBookings, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('confirmed_date', newDate.toISOString())
      .neq('id', draggedBooking.value.id)
    
    if (checkError) throw checkError
    
    if (existingBookings?.length) {
      throw new Error('There is already a booking at this time')
    }
    
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        confirmed_date: newDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', draggedBooking.value.id)
    
    if (updateError) throw updateError
    
    const bookingIndex = bookings.value.findIndex(b => b.id === draggedBooking.value?.id)
    if (bookingIndex !== -1) {
      bookings.value[bookingIndex].confirmed_date = newDate.toISOString()
    }
    
    toast.success('Booking rescheduled successfully')
  } catch (err) {
    console.error('Error rescheduling booking:', err)
    toast.error(err instanceof Error ? err.message : 'Failed to reschedule booking')
  } finally {
    isLoading.value = false
    dragOverDate.value = null
    draggedBooking.value = null
  }
}

const handleSaveBooking = async () => {
  if (selectedBooking.value) {
    try {
      await updateBooking(selectedBooking.value.id, {
        project_details: selectedBooking.value.project_details,
        notes: selectedBooking.value.notes
      })
      toast.success('Booking updated successfully')
      isEditing.value = false
      showBookingModal.value = false
      fetchBookings()
    } catch (err) {
      toast.error('Failed to update booking')
    }
  }
}

const handleEditBooking = () => {
  isEditing.value = true
}

// Watch for view or date changes to refetch bookings
watch([() => currentDate.value, () => view.value], () => {
  fetchBookings()
}, { immediate: true })
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow">
    <!-- Calendar Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
      <div>
        <h2 class="text-xl font-semibold text-gray-800">Studio Calendar</h2>
        <p class="text-sm text-gray-500">{{ currentMonthName }}</p>
      </div>
      <div class="flex items-center space-x-2">
        <button 
          @click="previousMonth"
          class="p-2 rounded-full hover:bg-gray-100"
          aria-label="Previous month"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          @click="nextMonth"
          class="p-2 rounded-full hover:bg-gray-100"
          aria-label="Next month"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div class="flex items-center space-x-2">
        <div class="flex rounded-md shadow-sm">
          <button
            v-for="viewType in availableViews"
            :key="viewType"
            @click="view = viewType"
            :class="[
              'px-4 py-2 text-sm font-medium',
              view === viewType 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            ]"
          >
            {{ viewType.charAt(0).toUpperCase() + viewType.slice(1) }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Calendar Component -->
    <v-calendar
      v-model="currentDate"
      :attributes="formattedBookings"
      :view="view"
      :is-dark="false"
      :is-expanded="false"
      :trim-weeks="view === 'month'"
      class="custom-calendar"
      @dayclick="handleDayClick"
      @update:from-page="fetchBookings"
    >
      <template #day-content="{ day, dayEvents }">
        <div class="flex flex-col h-full">
          <div class="flex justify-between items-center mb-1">
            <span 
              :class="[
                'text-sm font-medium',
                isToday(day.date) ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : '',
                !isToday(day.date) && isPast(day.date) ? 'text-gray-400' : 'text-gray-900'
              ]"
            >
              {{ day.day }}
            </span>
            <div class="flex space-x-1">
              <template v-for="event in dayEvents" :key="event.key">
                <div 
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: event.dot.color }"
                  @click.stop="handleEventClick({ event })"
                ></div>
              </template>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto max-h-24">
            <div 
              v-for="event in dayEvents" 
              :key="event.key"
              @click.stop="handleEventClick({ event })"
              class="text-xs p-1 mb-1 rounded truncate cursor-pointer"
              :style="{ 
                backgroundColor: `${event.dot.color}20`,
                borderLeft: `3px solid ${event.dot.color}`
              }"
            >
              <div class="font-medium truncate">{{ event.popover.label }}</div>
              <div class="text-gray-600 text-xxs truncate">
                {{ format(new Date(event.dates), 'h:mm a') }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </v-calendar>
    
    <!-- Booking Details Modal -->
    <div v-if="showBookingModal && selectedBooking" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start">
            <h3 class="text-lg font-medium text-gray-900">
              {{ selectedBooking.client_name || 'Booking Details' }}
            </h3>
            <button 
              @click="showBookingModal = false"
              class="text-gray-400 hover:text-gray-500"
              aria-label="Close"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="mt-4 space-y-4">
            <div v-if="!isEditing">
              <div>
                <h4 class="text-sm font-medium text-gray-500">Date & Time</h4>
                <p class="mt-1 text-sm text-gray-900">
                  {{ selectedBooking.display_date || 'Not specified' }}
                </p>
              </div>
              
              <div v-if="selectedBooking.client_email">
                <h4 class="text-sm font-medium text-gray-500">Email</h4>
                <p class="mt-1 text-sm text-gray-900">{{ selectedBooking.client_email }}</p>
              </div>
              
              <div v-if="selectedBooking.client_phone">
                <h4 class="text-sm font-medium text-gray-500">Phone</h4>
                <p class="mt-1 text-sm text-gray-900">{{ selectedBooking.client_phone }}</p>
              </div>
              
              <div v-if="selectedBooking.project_details">
                <h4 class="text-sm font-medium text-gray-500">Project Details</h4>
                <p class="mt-1 text-sm text-gray-900 whitespace-pre-line">{{ selectedBooking.project_details }}</p>
              </div>
              
              <div v-if="selectedBooking.notes">
                <h4 class="text-sm font-medium text-gray-500">Notes</h4>
                <p class="mt-1 text-sm text-gray-900 whitespace-pre-line">{{ selectedBooking.notes }}</p>
              </div>
            </div>

            <div v-else>
              <div>
                <label class="text-sm font-medium text-gray-500">Project Details</label>
                <textarea v-model="selectedBooking.project_details" rows="4" class="w-full mt-1 p-2 border rounded-md"></textarea>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500">Notes</label>
                <textarea v-model="selectedBooking.notes" rows="4" class="w-full mt-1 p-2 border rounded-md"></textarea>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="showBookingModal = false; isEditing = false"
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {{ isEditing ? 'Cancel' : 'Close' }}
              </button>
              <button
                v-if="!isEditing"
                type="button"
                @click="handleEditBooking"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Edit Booking
              </button>
              <button
                v-else
                type="button"
                @click="handleSaveBooking"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-1">
      <!-- Day Headers -->
      <div 
        v-for="dayName in dayNames" 
        :key="dayName"
        class="text-center text-sm font-medium text-gray-500 py-2"
      >
        {{ dayName }}
      </div>

      <!-- Empty Cells for Days Before 1st -->
      <div 
        v-for="n in emptyDays" 
        :key="`empty-${n}`" 
        class="h-24 border border-gray-100"
      ></div>

      <!-- Calendar Days -->
      <div 
        v-for="day in daysInMonth" 
        :key="day.toString()"
        class="p-2 border min-h-24 relative transition-colors duration-200"
        :class="{
          'bg-gray-50': !isSameMonth(day, currentDate),
          'bg-white': isSameMonth(day, currentDate) && !(dragOverDate && isSameDay(day, dragOverDate)),
          'bg-green-50 border-green-300': dragOverDate && isSameDay(day, dragOverDate),
          'text-gray-400': !isSameMonth(day, currentDate),
          'font-semibold': isToday(day),
          'text-red-500': isWeekend(day) && isSameMonth(day, currentDate),
          'cursor-not-allowed opacity-50': isPast(day) && !isToday(day),
          'cursor-move': (isDragging && !isPast(day)) || isToday(day)
        }"
        :title="format(day, 'EEEE, MMMM d, yyyy')"
        @dragover.prevent="onDragOver($event, day)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, day)"
      >
        <div class="flex justify-between items-center mb-1">
          <span :class="{ 'font-bold': isToday(day) }">{{ format(day, 'd') }}</span>
          <span v-if="isToday(day)" class="text-xs bg-green-600 text-white rounded-full w-2 h-2"></span>
        </div>
        
        <!-- Bookings for this day -->
        <div v-if="hasBookings(day)" class="mt-1 space-y-1">
          <div 
            v-for="booking in getBookingsForDay(day)" 
            :key="booking.id"
            class="text-xs p-1 rounded truncate"
            :class="{
              'bg-green-100 text-green-800': booking.status === 'confirmed',
              'bg-yellow-100 text-yellow-800': booking.status === 'pending',
              'bg-red-100 text-red-800': booking.status === 'cancelled' || booking.status === 'rejected',
              'bg-blue-100 text-blue-800': !booking.status
            }"
            @click="handleEventClick({ event: { customData: booking }})"
          >
            <div class="font-medium truncate">{{ booking.client_name || 'Unnamed Client' }}</div>
            <div class="text-xxs opacity-75 truncate">
              {{ booking.confirmed_date ? formatTime(booking.confirmed_date) : 
                 booking.preferred_dates?.[0] ? formatTime(booking.preferred_dates[0]) : 'Time not set' }}
            </div>
          </div>
        </div>
        
        <!-- Bookings for the Day -->
        <div class="mt-1 space-y-1">
          <div 
            v-for="booking in getBookingsForDay(day)" 
            :key="booking.id"
            draggable="true"
            @dragstart="onDragStart(booking)"
            @dragend="onDragEnd"
            class="text-xs p-1 rounded truncate cursor-grab active:cursor-grabbing"
            :class="{
              'bg-green-100 text-green-800 hover:bg-green-200': booking.status === 'confirmed',
              'bg-yellow-100 text-yellow-800 hover:bg-yellow-200': booking.status === 'pending',
              'bg-red-100 text-red-800 hover:bg-red-200': booking.status === 'rejected',
              'bg-blue-100 text-blue-800 hover:bg-blue-200': booking.status === 'completed',
              'bg-gray-100 text-gray-800 hover:bg-gray-200': !booking.status,
              'opacity-50': draggedBooking?.id === booking.id
            }"
            :title="`${booking.start_time} - ${booking.status || 'no status'}\n${booking.client_name}\n${booking.notes || ''}\n\nDrag to reschedule`"
          >
            {{ booking.start_time }} - {{ booking.client_name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
