<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },

  job: {
    type: Object,
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

async function archiveJob() {
  if (!props.job || !archiveNote.value.trim()) {
    return;
  }

  archiving.value = true;

  error.value = '';

  try {
    await $fetch('/api/jobs/archive', {
      method: 'PATCH',

      body: {
        jobId: props.job.id,

        note: archiveNote.value.trim(),
      },
    });

    emit('archived');
  } catch (err) {
    error.value = err?.data?.statusMessage || err?.statusMessage || 'Failed to archive job.';
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
        <div class="min-w-0">
          <h2 class="text-xl font-semibold tracking-tight text-gray-900">Archive job</h2>

          <p class="mt-1.5 truncate text-sm text-gray-500">
            {{ job?.title }}

            <span v-if="job?.company"> · {{ job.company }} </span>
          </p>
        </div>
      </div>

      <!-- BODY -->

      <div class="space-y-6 px-6 py-6">
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
            placeholder="e.g. Mostly Java/Spring, not relevant to my stack."
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
        <button
          type="button"
          class="w-full rounded-xl bg-gray-800 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-900 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!archiveNote.trim() || archiving"
          @click="archiveJob">
          {{ archiving ? 'Archiving...' : 'Archive job' }}
        </button>
      </div>
    </div>
  </div>
</template>
