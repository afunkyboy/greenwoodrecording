import { createRouter, createWebHistory } from 'vue-router'
import BookingForm from '@/components/BookingForm.vue'
import LoginForm from '@/components/LoginForm.vue'
import AdminDashboard from '@/views/AdminDashboard.vue'
import AdminCalendar from '@/views/AdminCalendar.vue'
import ProtectedRoute from '@/components/ProtectedRoute.vue'
import TestConnection from '@/views/TestConnection.vue'
import TestBooking from '@/views/TestBooking.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: BookingForm,
    meta: { title: 'Book a Session' }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginForm,
    meta: { title: 'Admin Login' }
  },
  {
    path: '/admin',
    component: () => import('@/components/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'Admin',
        component: AdminDashboard,
        meta: { 
          title: 'Dashboard',
          subtitle: 'Overview of your studio activities',
          icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
        }
      },
      {
        path: 'bookings',
        name: 'AdminBookings',
        component: () => import('@/views/AdminBookings.vue'),
        meta: { 
          title: 'Bookings',
          subtitle: 'Manage and view all bookings',
          icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
        }
      },
      {
        path: 'calendar',
        name: 'AdminCalendar',
        component: AdminCalendar,
        meta: { 
          title: 'Calendar',
          subtitle: 'View and manage your schedule',
          icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
        }
      },
      {
        path: 'clients',
        name: 'AdminClients',
        component: () => import('@/views/AdminClients.vue'),
        meta: { 
          title: 'Clients',
          subtitle: 'Manage client information',
          icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
        }
      },
      {
        path: 'availability',
        name: 'AdminAvailability',
        component: () => import('@/views/AdminAvailability.vue'),
        meta: { 
          title: 'Availability',
          subtitle: 'Set your working hours and availability',
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
        }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/AdminSettings.vue'),
        meta: { 
          title: 'Settings',
          subtitle: 'Configure your studio settings',
          icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
        }
      }
    ]
  },
  {
    path: '/test-connection',
    name: 'TestConnection',
    component: TestConnection,
    meta: { title: 'Test Connection' }
  },
  {
    path: '/test-booking',
    name: 'TestBooking',
    component: TestBooking,
    meta: { title: 'Test Booking' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

// Update document title based on route meta
router.beforeEach((to, _from, next) => {
  const siteTitle = import.meta.env.VITE_APP_TITLE || 'Greenwood Recording Studio'
  document.title = to.meta.title ? `${to.meta.title} | ${siteTitle}` : siteTitle
  next()
})

export default router
