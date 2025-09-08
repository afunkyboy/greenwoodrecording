<script setup>
import AvailabilityManager from '@/components/admin/AvailabilityManager.vue'
</script>

<template>
  <div class="py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h2 class="text-xl font-semibold text-gray-900">Manage Availability</h2>
          <p class="mt-1 mb-4 text-sm text-gray-500">
            Set your available hours and block off dates when you're not available.
          </p>
          <AvailabilityManager />
        </div>
      </div>
    </div>
  </div>
</template>
