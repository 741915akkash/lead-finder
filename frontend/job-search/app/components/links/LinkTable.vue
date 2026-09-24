<script setup>
defineProps({
  links: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['delete', 'update-notes']);

function updateNotes(id, notes) {
  emit('update-notes', { id, notes });
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <!-- Table Header -->
    <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
      <h2 class="text-sm font-semibold text-gray-900">All Links</h2>
      <span class="text-xs text-gray-500">{{ links.length }} saved</span>
    </div>

    <!-- Table -->
    <div v-if="links.length" class="overflow-x-auto">
      <table class="w-full min-w-[700px] text-left text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="w-[22%] px-4 py-2.5 font-semibold text-gray-600">Name</th>
            <th class="w-[32%] px-4 py-2.5 font-semibold text-gray-600">URL</th>
            <th class="px-4 py-2.5 font-semibold text-gray-600">Notes</th>
            <th class="w-20 px-4 py-2.5 text-right font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-gray-100">
          <tr v-for="link in links" :key="link.id" class="transition hover:bg-gray-50">
            <!-- Name -->
            <td class="px-4 py-3 font-medium text-gray-900">
              {{ link.name }}
            </td>

            <!-- URL -->
            <td class="px-4 py-3">
              <a
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                class="block max-w-sm truncate text-blue-600 hover:text-blue-800 hover:underline"
                :title="link.url">
                {{ link.url }}
              </a>
            </td>

            <!-- Editable Notes -->
            <td class="px-4 py-2">
              <input
                :key="`${link.id}-${link.notes}`"
                :value="link.notes"
                type="text"
                placeholder="Add notes..."
                class="w-full min-w-[150px] rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-gray-700 outline-none transition hover:border-gray-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
                @change="updateNotes(link.id, $event.target.value)" />
            </td>

            <!-- Actions -->
            <td class="px-4 py-3 text-right">
              <button
                type="button"
                class="rounded-md px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                @click="emit('delete', link.id)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="px-4 py-12 text-center">
      <h3 class="text-sm font-semibold text-gray-700">No links added yet</h3>
      <p class="mt-1 text-sm text-gray-500">Use the form above to save your first link.</p>
    </div>
  </div>
</template>
