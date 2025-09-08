import { ref, computed } from 'vue'
import { supabase, TABLES } from '@/lib/supabase'
import { addDays, format } from 'date-fns'
import { useNotifications } from './useNotifications'

export const useBookings = () => {
  const bookings = ref([])
  const availability = ref([])
  const loading = ref(false)
  const error = ref(null)
  const success = ref(false)

  // ... (keep all existing code until the end of the file)

  // Update booking status
  const updateBookingStatus = async (bookingId, status) => {
    console.log(`Updating booking ${bookingId} status to:`, status)
    loading.value = true
    error.value = null

    try {
      console.log('Sending update to Supabase...')
      const { data, error: updateError } = await supabase
        .from(TABLES.BOOKINGS)
        .update({ 
          status,
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)
        .select()

      console.log('Update response:', { data, updateError })

      if (updateError) {
        console.error('Supabase update error:', updateError)
        throw updateError
      }

      // Update local state
      const bookingIndex = bookings.value.findIndex(b => b.id === bookingId)
      if (bookingIndex !== -1) {
        const updatedBooking = {
          ...bookings.value[bookingIndex],
          status,
          updated_at: new Date().toISOString()
        }
        console.log('Updating local state with:', updatedBooking)
        bookings.value[bookingIndex] = updatedBooking
      } else {
        console.warn(`Booking ${bookingId} not found in local state`)
      }

      // Refresh data to ensure consistency
      await fetchBookings()
      
      return true
    } catch (err) {
      console.error('Error updating booking status:', err)
      error.value = `Failed to ${status} booking. Please try again.`
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Approve booking
  const approveBooking = async (bookingId) => {
    console.log('Approving booking:', bookingId)
    return await updateBookingStatus(bookingId, 'confirmed')
  }
  
  // Reject booking
  const rejectBooking = async (bookingId) => {
    console.log('Rejecting booking:', bookingId)
    return await updateBookingStatus(bookingId, 'rejected')
  }

  // ... (rest of the existing code)

  // Submit a new booking
  const submitBooking = async (bookingData) => {
    console.log('Submitting booking:', bookingData)
    loading.value = true
    error.value = null
    success.value = false

    try {
      // Insert the booking into the database
      const { data, error: insertError } = await supabase
        .from(TABLES.BOOKINGS)
        .insert([{
          client_name: bookingData.client_name,
          email: bookingData.email,
          phone: bookingData.phone,
          project_details: bookingData.project_details,
          preferred_dates: bookingData.preferred_dates,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()

      if (insertError) throw insertError

      console.log('Booking submitted successfully:', data)
      success.value = true
      return data[0]
    } catch (err) {
      console.error('Error submitting booking:', err)
      error.value = err.message || 'Failed to submit booking. Please try again.'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch all bookings
  const fetchBookings = async () => {
    console.log('Fetching bookings...')
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      console.log('Bookings fetched:', data)
      bookings.value = data || []
      return data
    } catch (err) {
      console.error('Error fetching bookings:', err)
      error.value = 'Failed to load bookings. Please try again.'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    bookings,
    availability,
    loading,
    error,
    success,
    submitBooking,
    fetchBookings,
    fetchAvailability: async () => {}, // Placeholder
    updateAvailability: async () => {}, // Placeholder
    approveBooking,
    rejectBooking,
    isDateAvailable: () => true, // Placeholder
    getAvailableDates: async () => [] // Placeholder
  }
}
