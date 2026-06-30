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

function formatDate(date) {
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
            @click="$emit('sort', 'score')">
            Score
          </th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Title</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Keyword</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Subreddit</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Source</th>

          <th
            class="cursor-pointer px-4 py-3 text-left text-sm font-semibold select-none"
            @click="$emit('sort', 'published_at')">
            Date
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="row in rows" :key="row.id" class="border-t hover:bg-gray-50 bg-gray-200">
          <td class="px-4 py-3">
            {{ row.score }}
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
            {{ row.keyword }}
          </td>

          <td class="px-4 py-3">
            {{ row.subreddit }}
          </td>

          <td class="px-4 py-3">
            {{ row.source }}
          </td>

          <td class="px-4 py-3">
            {{ formatDate(row.published_at) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
