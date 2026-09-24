<script setup>
import { ref } from 'vue';

const emit = defineEmits(['add']);

const name = ref('');
const url = ref('');
const notes = ref('');

function submitForm() {
  const trimmedName = name.value.trim();
  const trimmedUrl = url.value.trim();

  if (!trimmedName || !trimmedUrl) return;

  emit('add', {
    name: trimmedName,
    url: trimmedUrl,
    notes: notes.value.trim(),
  });

  name.value = '';
  url.value = '';
  notes.value = '';
}
</script>

<template>
  <form class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm" @submit.prevent="submitForm">
    <div class="flex flex-wrap items-center gap-2">
      <input
        id="link-name"
        v-model="name"
        type="text"
        placeholder="Name"
        required
        class="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />

      <input
        id="link-url"
        v-model="url"
        type="url"
        placeholder="https://example.com"
        required
        class="min-w-0 flex-[2] rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />

      <input
        id="link-notes"
        v-model="notes"
        type="text"
        placeholder="Notes (optional)"
        class="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />

      <button
        type="submit"
        class="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
        + Add Link
      </button>
    </div>
  </form>
</template>
