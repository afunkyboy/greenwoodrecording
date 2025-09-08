<template>
  <div class="p-4 bg-gray-100 rounded-lg">
    <h2 class="text-xl font-bold mb-4">Supabase Connection Test</h2>
    <div v-if="loading" class="text-blue-600">Testing connection...</div>
    <div v-else-if="error" class="text-red-600">Error: {{ error }}</div>
    <div v-else class="text-green-600">✅ Successfully connected to Supabase!</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';

const loading = ref(true);
const error = ref('');
const status = ref('');

onMounted(async () => {
  try {
    // Test the connection by fetching the current session
    const { error: sessionError } = await supabase.from('clients').select('*').limit(1)
    if (sessionError) {
      status.value = `Error: ${sessionError.message}`
    } else {
      status.value = 'Successfully connected to Supabase and fetched data.'
    }
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    error.value = err instanceof Error ? err.message : 'Failed to connect to Supabase';
  } finally {
    loading.value = false;
  }
});
</script>
