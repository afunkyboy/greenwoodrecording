<script setup lang="ts">
import { ref } from 'vue'

const form = ref({
  studioName: 'Greenwood Recording Studio',
  contactEmail: 'info@greenwoodrecording.com',
  businessHours: 'Mon-Fri: 9am-9pm\nSat: 10am-6pm\nSun: Closed',
  timezone: 'America/Chicago',
  currency: 'USD',
  taxRate: 9.25
})

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles'
]

const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' }
]
</script>

<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Studio Information -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Studio Information</h3>
        </div>
        
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div class="sm:col-span-4">
              <label class="block text-sm font-medium text-gray-700">Studio Name</label>
              <input
                v-model="form.studioName"
                type="text"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
            </div>

            <div class="sm:col-span-4">
              <label class="block text-sm font-medium text-gray-700">Contact Email</label>
              <input
                v-model="form.contactEmail"
                type="email"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
            </div>

            <div class="sm:col-span-6">
              <label class="block text-sm font-medium text-gray-700">Business Hours</label>
              <textarea
                v-model="form.businessHours"
                rows="4"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm font-mono text-sm"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Booking Settings -->
      <div class="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Booking Settings</h3>
        </div>
        
        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div class="sm:col-span-3">
              <label class="block text-sm font-medium text-gray-700">Timezone</label>
              <select
                v-model="form.timezone"
                class="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option v-for="tz in timezones" :key="tz" :value="tz">
                  {{ tz }}
                </option>
              </select>
            </div>

            <div class="sm:col-span-3">
              <label class="block text-sm font-medium text-gray-700">Currency</label>
              <select
                v-model="form.currency"
                class="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
                  {{ currency.name }} ({{ currency.code }})
                </option>
              </select>
            </div>

            <div class="sm:col-span-3">
              <label class="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
              <input
                v-model.number="form.taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
            </div>
          </div>
        </div>

        <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            type="button"
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
