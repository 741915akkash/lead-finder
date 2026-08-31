<script setup>
const route = useRoute();

const { data: job, error } = await useFetch(
  `/api/jobs/${route.params.id}/packet`,
  {
    query: {
      type: 'application',
    },
  },
);
</script>

<template>
  <main class="min-h-screen bg-white p-8">
    <div class="mx-auto max-w-5xl">
      <div v-if="error" class="text-red-600">
        {{ error.statusMessage || 'Failed to load packet.' }}
      </div>

      <pre
        v-else-if="job?.packet"
        class="whitespace-pre-wrap break-words font-mono text-sm leading-6 text-gray-900"
        >{{ job.packet }}</pre
      >

      <div v-else class="text-gray-500">
        Application packet not found.
      </div>
    </div>
  </main>
</template>