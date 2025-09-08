import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'
import { format, addDays } from 'date-fns'

// Get Supabase credentials from command line arguments
const args = process.argv.slice(2)
const supabaseUrl = args[0]
const supabaseKey = args[1]

if (!supabaseUrl || !supabaseKey) {
  console.error('Usage: node seed-test-bookings.js <supabase-url> <supabase-anon-key>')
  console.error('You can find these values in your Supabase project settings > API')
  process.exit(1)
}

console.log('Connecting to Supabase...')
const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestBookings() {
  try {
    // Create a test client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert([
        {
          name: 'Test User',
          email: 'test@example.com',
          phone: '(555) 123-4567'
        }
      ])
      .select()
      .single()

    if (clientError) {
      if (clientError.code === '23505') {
        console.log('Test client already exists, continuing...')
        // Get existing test client
        const { data: existingClient } = await supabase
          .from('clients')
          .select('*')
          .eq('email', 'test@example.com')
          .single()
        
        if (!existingClient) {
          throw new Error('Failed to get existing test client')
        }
        await createBookingsForClient(existingClient.id)
        return
      }
      throw clientError
    }

    if (!client) {
      throw new Error('Failed to create test client')
    }

    await createBookingsForClient(client.id)

  } catch (error) {
    console.error('Error creating test bookings:', error)
  }
}

async function createBookingsForClient(clientId) {
  const today = new Date()
  
  // Create bookings for next 7 days
  for (let i = 1; i <= 7; i++) {
    const bookingDate = addDays(today, i)
    const startHour = 9 + Math.floor(Math.random() * 8) // Random hour between 9am-5pm
    const startTime = new Date(bookingDate)
    startTime.setHours(startHour, 0, 0, 0)
    
    const status = i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'confirmed' : 'completed'
    
    const { error } = await supabase
      .from('bookings')
      .insert([
        {
          client_id: clientId,
          project_details: `Test project ${i} - ${faker.lorem.sentence()}`,
          preferred_dates: [format(bookingDate, 'yyyy-MM-dd')],
          status,
          confirmed_date: status === 'pending' ? null : startTime.toISOString(),
          notes: status === 'pending' ? 'Needs confirmation' : 'Test booking'
        }
      ])

    if (error) {
      console.error(`Error creating booking for day ${i}:`, error)
    } else {
      console.log(`Created ${status} booking for ${format(bookingDate, 'yyyy-MM-dd')}`)
    }
  }
}

createTestBookings()
