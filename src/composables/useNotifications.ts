import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

interface Notification {
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  id: number
}

export function useNotifications() {
  const notifications = ref<Notification[]>([])
  let nextId = 0

  const addNotification = (type: Notification['type'], message: string, duration = 5000) => {
    const id = nextId++
    const notification = { type, message, id }
    
    notifications.value.push(notification)
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }

  const removeNotification = (id: number) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  // Send email notification using Supabase Edge Function
  const sendEmailNotification = async (to: string, subject: string, html: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: JSON.stringify({ to, subject, html }),
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Send booking confirmation email
  const sendBookingConfirmation = async (email: string, clientName: string, bookingDetails: any) => {
    const subject = `Booking Confirmation - ${bookingDetails.status}`
    
    let statusMessage = ''
    if (bookingDetails.status === 'confirmed') {
      statusMessage = `Your booking for ${bookingDetails.preferred_dates} has been confirmed!`
    } else if (bookingDetails.status === 'rejected') {
      statusMessage = 'We regret to inform you that your booking request could not be accommodated at this time.'
    } else {
      statusMessage = 'Your booking request has been received and is pending confirmation.'
    }
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmation</h2>
        <p>Hello ${clientName},</p>
        
        <p>${statusMessage}</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details:</h3>
          <p><strong>Status:</strong> ${bookingDetails.status}</p>
          <p><strong>Preferred Dates:</strong> ${bookingDetails.preferred_dates}</p>
          <p><strong>Project:</strong> ${bookingDetails.project_details}</p>
        </div>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>The Greenwood Recording Studio Team</p>
      </div>
    `

    return sendEmailNotification(email, subject, html)
  }

  // Test function - can be called from browser console
  const testEmail = async (email: string = 'test@example.com') => {
    try {
      const response = await sendEmailNotification(
        email,
        'Test Email from Greenwood Recording',
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
        '<h2>Test Email</h2>' +
        '<p>This is a test email from the Greenwood Recording Studio booking system.</p>' +
        '<p>If you received this email, the email notification system is working correctly!</p>' +
        '</div>'
      )
      return response
    } catch (error) {
      throw error
    }
  }

  // Expose test function in development
  if (import.meta.env.DEV) {
    // @ts-ignore - Expose for testing
    window.__greenwoodTestEmail = testEmail
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    sendEmailNotification,
    sendBookingConfirmation,
    testEmail // Expose for programmatic testing
  }
}
