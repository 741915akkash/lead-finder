<script setup>
defineProps({
  rows: {
    type: Array,
    default: () => [],
  },

  loading: {
    type: Boolean,
    default: false,
  },

  sort: {
    type: String,
  },

  order: {
    type: String,
    default: 'desc',
  },
});

const emit = defineEmits(['sort']);

function formatScore(score) {
  if (score === null || score === undefined) return '-';

  return Math.round(score * 100);
}

function formatDate(date) {
  if (!date) return '-';

  return new Date(date).toLocaleDateString();
}
</script>

<template>
  <div class="overflow-x-auto rounded-xl border bg-white shadow-sm">
    <table class="min-w-full">
      <thead class="bg-gray-50">
        <tr>
          <th
            class="cursor-pointer px-4 py-3 text-left text-sm font-semibold select-none"
            @click="emit('sort', 'fit_score')">
            Fit
          </th>

          <th
            class="cursor-pointer px-4 py-3 text-left text-sm font-semibold select-none"
            @click="emit('sort', 'priority_score')">
            Priority
          </th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Job</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Company</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Location</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Source</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Recommendation</th>

          <th
            class="cursor-pointer px-4 py-3 text-left text-sm font-semibold select-none"
            @click="emit('sort', 'posted_at')">
            Posted
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t hover:bg-gray-50">
          <td class="px-4 py-3 font-semibold">
            {{ formatScore(row.fit_score) }}
          </td>

          <td class="px-4 py-3">
            {{ row.priority_score ?? '-' }}
          </td>

          <td class="px-4 py-3">
            <a
              :href="row.url"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-gray-900 hover:text-blue-600 hover:underline">
              {{ row.title }}
            </a>
          </td>

          <td class="px-4 py-3">
            {{ row.company || '-' }}
          </td>

          <td class="px-4 py-3">
            {{ row.location || '-' }}
          </td>

          <td class="px-4 py-3">
            {{ row.source || '-' }}
          </td>

          <td class="px-4 py-3">
            {{ row.recommendation || '-' }}
          </td>

          <td class="px-4 py-3">
            {{ formatDate(row.posted_at) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
