<script setup>
import { ref, onMounted, watch } from 'vue';
import LinkForm from '../components/links/LinkForm.vue';
import LinksTable from '../components/links/LinkTable.vue';

const STORAGE_KEY = 'job-search-saved-links';

const links = ref([]);
const isLoaded = ref(false);

function updateNotes({ id, notes }) {
  const link = links.value.find((link) => link.id === id);

  if (link) {
    link.notes = notes;
  }
}

onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        links.value = parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load links:', error);
  }

  isLoaded.value = true;
});

watch(
  links,
  (newLinks) => {
    if (!isLoaded.value) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLinks));
    } catch (error) {
      console.error('Failed to save links:', error);
    }
  },
  { deep: true },
);

function addLink(link) {
  links.value.unshift({
    id: crypto.randomUUID(),
    name: link.name,
    url: link.url,
    notes: link.notes,
  });
}

function deleteLink(id) {
  links.value = links.value.filter((link) => link.id !== id);
}
</script>

<template>
  <main class="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 md:px-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900">Saved Links</h1>

          <p class="mt-1 text-sm text-gray-500">Organize useful job search links in one place.</p>
        </div>

        <span class="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-600">
          {{ links.length }} links
        </span>
      </div>

      <!-- Links Table -->
      <LinksTable :links="links" @delete="deleteLink" @update-notes="updateNotes" />

      <!-- Add Link Form -->
      <LinkForm @add="addLink" />

      <p class="text-xs text-gray-400">Your links are saved in this browser.</p>
    </div>
  </main>
</template>
