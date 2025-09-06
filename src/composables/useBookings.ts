import { ref, computed } from 'vue'
import { supabase, TABLES } from '@/lib/supabase'
import { addDays, format } from 'date-fns'
import { useNotifications } from './useNotifications'

export interface Booking extends BookingRequest {
  id: string
  created_at: string
  updated_at: string
}

export interface BookingRequest {
  client_name: string
  email: string
  phone: string
  project_details: string
  preferred_dates: string[]
  status?: 'pending' | 'confirmed' | 'rejected'
  notes?: string
}

export function useBookings() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)
  const availableDates = ref<Date[]>([])
  const bookedDates = ref<Set<string>>(new Set())
  const bookings = ref<Booking[]>([])

  // Get available dates for the next 30 days
  const getAvailableDates = async (): Promise<Date[]> => {
    try {
      loading.value = true
      
      // Get all bookings within the next 30 days
      const today = new Date()
      const thirtyDaysLater = addDays(today, 30)
      
      const { data: bookings, error } = await supabase
        .from(TABLES.BOOKINGS)
        .select('preferred_dates, status')
        .gte('preferred_dates', today.toISOString().split('T')[0])
        .lte('preferred_dates', thirtyDaysLater.toISOString().split('T')[0])
      
      if (error) throw error

      // Create a set of all booked dates
      const newBookedDates = new Set<string>()
      bookings?.forEach(booking => {
        if (booking.status === 'confirmed') {
          booking.preferred_dates.forEach((date: string) => {
            newBookedDates.add(date.split('T')[0])
          })
        }
      })
      
      bookedDates.value = newBookedDates
      
      // Generate available dates (next 30 days excluding weekends and booked dates)
      const dates: Date[] = []
      let currentDate = new Date()
      
      while (dates.length < 30) {
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          const dateStr = currentDate.toISOString().split('T')[0]
          if (!bookedDates.value.has(dateStr)) {
            dates.push(new Date(currentDate))
          }
        }
        currentDate = addDays(currentDate, 1)
      }
      
      availableDates.value = dates
      return dates
      
    } catch (err) {
      console.error('Error fetching available dates:', err)
      error.value = 'Failed to load available dates'
      return []
    } finally {
      loading.value = false
    }
  }

  // Check if a date is available for booking
  const isDateAvailable = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day for comparison
    
    // Check if date is in the past
    if (date < today) {
      return false
    }
    
    // Check if date is already booked
    const dateStr = date.toISOString().split('T')[0]
    return !bookedDates.value.has(dateStr)
  }

  // Submit a new booking
  const submitBooking = async (booking: BookingRequest) => {
    loading.value = true
    error.value = null
    success.value = false
    const notifications = useNotifications()

    try {
      // First, create the client
      const { data: client, error: clientError } = await supabase
        .from(TABLES.CLIENTS)
        .insert({
          name: booking.client_name,
          email: booking.email,
          phone: booking.phone,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Then create the booking with the client ID
      const { data: bookingData, error: bookingError } = await supabase
        .from(TABLES.BOOKINGS)
        .insert({
          client_id: client.id,
          project_details: booking.project_details,
          preferred_dates: booking.preferred_dates,
          status: 'pending',
        })
        .select()

      if (bookingError) throw bookingError

      // Send confirmation email
      const formattedDates = booking.preferred_dates
        .map(date => format(new Date(date), 'MMMM d, yyyy'))
        .join(', ')
      
      const emailResponse = await notifications.sendBookingConfirmation(
        booking.email,
        booking.client_name,
        {
          status: 'pending',
          project_details: booking.project_details,
          preferred_dates: formattedDates,
          booking_id: bookingData?.[0]?.id
        }
      )

      if (!emailResponse.success) {
        console.error('Failed to send confirmation email:', emailResponse.error)
        notifications.addNotification('warning', 'Booking submitted, but we could not send a confirmation email.')
      } else {
        notifications.addNotification('success', 'Booking submitted successfully! A confirmation email has been sent.')
      }

      success.value = true
      return { success: true }
    } catch (err) {
      console.error('Error submitting booking:', err)
      error.value = err instanceof Error ? err.message : 'Failed to submit booking'
      return { error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Fetch all bookings
  const fetchBookings = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      const { data, error: fetchError } = await supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      bookings.value = data || []
    } catch (err) {
      console.error('Error fetching bookings:', err)
      error.value = 'Failed to load bookings. Please try again.'
    } finally {
      loading.value = false
    }
  }

  // Update booking status
  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'rejected'): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      const { error: updateError } = await supabase
        .from(TABLES.BOOKINGS)
        .update({ 
          status,
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)
        .select()
      
      if (updateError) throw updateError
      
      // Update local state
      const index = bookings.value.findIndex(b => b.id === bookingId)
      if (index !== -1) {
        bookings.value[index] = { ...bookings.value[index], status, updated_at: new Date().toISOString() }
      }
      
      success.value = true
    } catch (err) {
      console.error('Error updating booking status:', err)
      error.value = 'Failed to update booking status. Please try again.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update a booking
  const updateBooking = async (bookingId: string, updates: Partial<Booking>): Promise<void> => {
    try {
      loading.value = true
      error.value = null
      
      const { error: updateError } = await supabase
        .from(TABLES.BOOKINGS)
        .update({ 
          ...updates,
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)
        .select()
      
      if (updateError) throw updateError
      
      // Update local state
      const index = bookings.value.findIndex(b => b.id === bookingId)
      if (index !== -1) {
        bookings.value[index] = { ...bookings.value[index], ...updates, updated_at: new Date().toISOString() } as Booking
      }
      
      success.value = true
    } catch (err) {
      console.error('Error updating booking:', err)
      error.value = 'Failed to update booking. Please try again.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    success: computed(() => success.value),
    availableDates: computed(() => availableDates.value),
    bookings: computed(() => bookings.value),
    submitBooking,
    getAvailableDates,
    isDateAvailable,
    fetchBookings,
    updateBookingStatus,
    updateBooking
  }
}
