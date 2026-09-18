<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },

  company: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['close', 'archived']);

const archiveNote = ref('');

const archiving = ref(false);

const error = ref('');

watch(
  () => props.open,
  (open) => {
    if (open) {
      archiveNote.value = '';
      error.value = '';
    }
  },
);

function close() {
  if (archiving.value) {
    return;
  }

  emit('close');
}

async function archiveCompany() {
  if (!props.company || !archiveNote.value.trim()) {
    return;
  }

  archiving.value = true;
  error.value = '';

  try {
    await $fetch('/api/jobs/company-archive', {
      method: 'PATCH',

      body: {
        company: props.company,
        note: archiveNote.value.trim(),
      },
    });

    emit('archived');
  } catch (err) {
    error.value = err?.data?.statusMessage || err?.statusMessage || 'Failed to archive company jobs.';
  } finally {
    archiving.value = false;
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm"
    @click.self="close">
    <div class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
      <!-- HEADER -->

      <div class="border-b border-gray-100 px-6 py-5">
        <h2 class="text-xl font-semibold tracking-tight text-gray-900">Archive company</h2>

        <p class="mt-1.5 text-sm text-gray-500">
          Archive all job postings from
          <span class="font-medium text-gray-800">
            {{ company }}
          </span>
          ?
        </p>
      </div>

      <!-- BODY -->

      <div class="space-y-6 px-6 py-6">
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          This will archive all job postings currently associated with this company.
        </div>

        <div>
          <div class="mb-2 flex items-center justify-between">
            <label class="block text-sm font-medium text-gray-800">
              Why are you archiving this?
              <span class="text-gray-400">*</span>
            </label>

            <span class="text-xs text-gray-400"> Required </span>
          </div>

          <textarea
            v-model="archiveNote"
            rows="4"
            placeholder="e.g. Company is not relevant to my target roles."
            class="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900/5" />
        </div>

        <!-- ERROR -->

        <div
          v-if="error"
          class="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="mt-0.5 h-4 w-4 shrink-0">
            <circle cx="12" cy="12" r="9" />

            <path stroke-linecap="round" d="M12 8v4M12 16h.01" />
          </svg>

          <span>
            {{ error }}
          </span>
        </div>
      </div>

      <!-- FOOTER -->

      <div class="border-t border-gray-100 bg-gray-50/70 px-6 py-4">
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="archiving"
            @click="close">
            Cancel
          </button>

          <button
            type="button"
            class="flex-1 rounded-xl bg-gray-800 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-900 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!archiveNote.trim() || archiving"
            @click="archiveCompany">
            {{ archiving ? 'Archiving...' : 'Archive All' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
