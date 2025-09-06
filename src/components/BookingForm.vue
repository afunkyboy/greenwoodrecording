<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBookings, type BookingRequest } from '@/composables/useBookings'

const { 
  loading, 
  submitBooking, 
  getAvailableDates
} = useBookings()

const form = ref<BookingRequest>({
  client_name: '',
  email: '',
  phone: '',
  project_details: '',
  preferred_dates: [],
})

const selectedDates = ref<Date[]>([])
const currentMonth = ref(new Date())
const isSelectingRange = ref(false)
const rangeStart = ref<Date | null>(null)
const rangeEnd = ref<Date | null>(null)
const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)

// Form validation
const formatPhoneNumber = () => {
  // Remove all non-digit characters
  const cleaned = form.value.phone.replace(/\D/g, '')
  
  // Format based on length
  let formatted = ''
  if (cleaned.length > 0) {
    formatted = '(' + cleaned.substring(0, 3)
  }
  if (cleaned.length >= 4) {
    formatted += ') ' + cleaned.substring(3, 6)
  }
  if (cleaned.length >= 7) {
    formatted += '-' + cleaned.substring(6, 10)
  } else if (cleaned.length >= 4) {
    formatted += cleaned.substring(6)
  } else if (cleaned.length > 0) {
    formatted = cleaned
  }
  
  form.value.phone = formatted
}

const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

const validateForm = (): boolean => {
  errors.value = {}
  
  if (!form.value.client_name.trim()) {
    errors.value.client_name = 'Name is required'
  }
  
  if (!form.value.email) {
    errors.value.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email address'
  }
  
  if (form.value.phone && !validatePhoneNumber(form.value.phone)) {
    errors.value.phone = 'Please enter a valid phone number'
  }
  
  if (!form.value.project_details.trim()) {
    errors.value.project_details = 'Project details are required'
  }
  
  if (selectedDates.value.length === 0) {
    errors.value.dates = 'Please select at least one preferred date'
  }
  
  return Object.keys(errors.value).length === 0
}

onMounted(async () => {
  await getAvailableDates()
})

const handleDateHover = (date: Date | null) => {
  if (isSelectingRange.value && rangeStart.value && date) {
    rangeEnd.value = date
  }
}

const isInRange = (date: Date | null): boolean => {
  if (!rangeStart.value || !rangeEnd.value || !date) return false
  
  const start = rangeStart.value < rangeEnd.value ? rangeStart.value : rangeEnd.value
  const end = rangeStart.value < rangeEnd.value ? rangeEnd.value : rangeStart.value
  
  return date >= start && date <= end
}

const handleDateClick = (date: Date | null) => {
  if (!date) return
  
  if (isSelectingRange.value) {
    if (!rangeStart.value) {
      rangeStart.value = date
      rangeEnd.value = null
    } else if (!rangeEnd.value) {
      rangeEnd.value = date
      
      // Add all dates in range to selected dates
      const start = rangeStart.value < rangeEnd.value ? rangeStart.value : rangeEnd.value
      const end = rangeStart.value < rangeEnd.value ? rangeEnd.value : rangeStart.value
      
      const currentDate = new Date(start)
      while (currentDate <= end) {
        if (!selectedDates.value.some(d => d.toDateString() === currentDate.toDateString())) {
          selectedDates.value.push(new Date(currentDate))
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // Reset range selection
      rangeStart.value = null
      rangeEnd.value = null
      isSelectingRange.value = false
    }
  } else {
    // Toggle single date selection
    const dateIndex = selectedDates.value.findIndex(d => d.toDateString() === date.toDateString())
    if (dateIndex >= 0) {
      selectedDates.value.splice(dateIndex, 1)
    } else {
      selectedDates.value.push(new Date(date))
    }
  }
  
  // Update form with selected dates
  form.value.preferred_dates = selectedDates.value.map(d => d.toISOString().split('T')[0])
}

const isDateSelected = (date: Date | null): boolean => {
  if (!date) return false
  return selectedDates.value.some(d => d.toDateString() === date.toDateString())
}

const isPastDate = (date: Date | null): boolean => {
  if (!date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

const removeDate = (dateToRemove: Date) => {
  const index = selectedDates.value.findIndex(d => d.toDateString() === dateToRemove.toDateString())
  if (index >= 0) {
    selectedDates.value.splice(index, 1)
    form.value.preferred_dates = selectedDates.value.map(d => d.toISOString().split('T')[0])
  }
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate()
}

const getMonthDays = (date: Date): (Date | null)[] => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = getDaysInMonth(year, month)
  
  const days: (Date | null)[] = []
  
  // Add empty cells for days before the first of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }
  
  return days
}

const nextMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1
  )
}

const prevMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1
  )
}

const monthName = (date: Date) => {
  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
}

const isToday = (date: Date | null): boolean => {
  if (!date) return false
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    await submitBooking(form.value)
    
    // Reset form on success
    form.value = {
      client_name: '',
      email: '',
      phone: '',
      project_details: '',
      preferred_dates: []
    }
    selectedDates.value = []
    
    // Show success message
    alert('Your booking request has been submitted successfully!')
  } catch (error) {
    console.error('Error submitting booking:', error)
    alert('There was an error submitting your booking. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg border border-gray-200">
    <div class="text-center mb-8">
      <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
        Book Your Studio Time
      </h1>
      <p class="text-gray-600">Fill out the form below to request a studio session</p>
    </div>

    <div v-if="Object.keys(errors).length > 0" class="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
      <p class="font-medium">Please fix the following errors:</p>
      <ul class="list-disc list-inside mt-2 space-y-1">
        <li v-for="(error, field) in errors" :key="field">
          {{ error }}
        </li>
      </ul>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <fieldset :disabled="loading" class="space-y-6">
        <!-- Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Full Name <span class="text-red-500">*</span></label>
          <input
            id="name"
            v-model.trim="form.client_name"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
            placeholder="Your name"
            :disabled="loading"
          >
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email <span class="text-red-500">*</span></label>
          <div class="relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              required
              class="block w-full pl-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              placeholder="your.email@example.com"
              :disabled="loading"
            >
          </div>
        </div>

        <!-- Phone -->
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <div class="relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              @input="formatPhoneNumber"
              class="block w-full pl-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
              placeholder="(123) 456-7890"
              :disabled="loading"
            >
          </div>
        </div>

        <!-- Project Details -->
        <div>
          <label for="project_details" class="block text-sm font-medium text-gray-700 mb-1">Project Details <span class="text-red-500">*</span></label>
          <textarea
            id="project_details"
            v-model.trim="form.project_details"
            rows="4"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
            placeholder="Tell us about your project..."
            :disabled="loading"
          ></textarea>
        </div>

        <!-- Date Selection -->
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <button
              type="button"
              @click="prevMonth"
              class="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              :disabled="loading"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 class="text-lg font-medium text-gray-900">{{ monthName(currentMonth) }}</h3>
            <button
              type="button"
              @click="nextMonth"
              class="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              :disabled="loading"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div class="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 font-medium">
            <div v-for="day in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" :key="day" class="py-1">
              {{ day }}
            </div>
          </div>

          <div class="grid grid-cols-7 gap-1">
            <div
              v-for="(date, index) in getMonthDays(currentMonth)"
              :key="index"
              @click="handleDateClick(date)"
              @mouseover="handleDateHover(date)"
              :class="[
                'h-10 flex items-center justify-center rounded-md cursor-pointer transition-colors',
                {
                  'text-gray-400': !date,
                  'bg-green-100 text-green-700 font-medium': date && isDateSelected(date),
                  'bg-gray-100': date && isInRange(date),
                  'hover:bg-gray-100': date && !isDateSelected(date),
                  'opacity-50 cursor-not-allowed': date && isPastDate(date),
                  'ring-2 ring-green-500': date && isToday(date)
                }
              ]"
            >
              {{ date ? date.getDate() : '' }}
            </div>
          </div>
        </div>

        <!-- Selected Dates -->
        <div v-if="selectedDates.length > 0" class="space-y-2">
          <p class="text-sm font-medium text-gray-700">Selected Dates:</p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(date, index) in selectedDates"
              :key="index"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700"
            >
              {{ formatDate(date) }}
              <button
                type="button"
                @click="removeDate(date)"
                class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-200 text-green-700 hover:bg-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                :disabled="loading"
              >
                <span class="sr-only">Remove date</span>
                <svg class="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Range Selection Toggle -->
        <div class="flex items-center">
          <input
            id="range-selection"
            v-model="isSelectingRange"
            type="checkbox"
            class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            :disabled="loading"
          >
          <label for="range-selection" class="ml-2 block text-sm text-gray-700">
            Select date range
          </label>
        </div>

        <!-- Submit Button -->
        <div class="pt-4">
          <button
            type="submit"
            class="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            :disabled="isSubmitting || loading"
          >
            <span v-if="isSubmitting" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
            <span v-else>Submit Booking Request</span>
          </button>
          <p class="mt-2 text-xs text-gray-500 text-center">
            By submitting this form, you agree to our
            <a href="#" class="text-green-600 hover:underline">Terms of Service</a> and
            <a href="#" class="text-green-600 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </fieldset>
    </form>
  </div>
</template>
