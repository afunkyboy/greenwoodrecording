export interface Client {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  client_id: string
  client?: Client
  client_name?: string
  client_email?: string
  client_phone?: string
  project_details?: string
  preferred_dates?: string[]
  status?: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'
  confirmed_date?: string | null
  booking_date?: string | Date | null // Alias for confirmed_date for calendar compatibility
  start_time?: string | Date | null
  end_time?: string | Date | null
  notes?: string
  created_at?: string
  updated_at?: string
  display_date?: string
}

export type BookingStatus = Booking['status']

export interface Availability {
  id: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  max_bookings: number
  current_bookings: number
  created_at: string
  updated_at: string
}
