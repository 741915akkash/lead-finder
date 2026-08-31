<script setup>
import { ref } from 'vue';

import ApplicationModal from '~/components/applications/ApplicationModal.vue';

import ArchiveModal from '~/components/table/ArchiveModal.vue';

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

const emit = defineEmits(['sort', 'application-saved', 'job-archived']);

const selectedJob = ref(null);

const selectedApplication = ref(null);

const showApplicationModal = ref(false);

const showArchiveModal = ref(false);

const editingNoteJobId = ref(null);

const editingNote = ref('');

const savingNote = ref(false);

const activeRowId = ref(null);

function formatScore(score) {
  if (score === null || score === undefined) {
    return '-';
  }

  return Math.round(score * 100);
}

function openApplication(row) {
  selectedJob.value = row;

  selectedApplication.value = row.application || null;

  showApplicationModal.value = true;
}

function closeApplication() {
  showApplicationModal.value = false;

  selectedJob.value = null;

  selectedApplication.value = null;
}

function handleSaved(application) {
  closeApplication();

  emit('application-saved', application);
}

function openArchive(row) {
  selectedJob.value = row;

  showArchiveModal.value = true;
}

function closeArchive() {
  showArchiveModal.value = false;

  selectedJob.value = null;
}

function handleArchived() {
  closeArchive();

  emit('job-archived');
}

function startEditingNote(row) {
  if (!row.application) {
    return;
  }

  editingNoteJobId.value = row.id;

  editingNote.value = row.application.notes || '';
}

function cancelEditingNote() {
  editingNoteJobId.value = null;

  editingNote.value = '';
}

async function saveNote(row) {
  if (!row.application || savingNote.value) {
    return;
  }

  savingNote.value = true;

  try {
    const result = await $fetch('/api/applications/update', {
      method: 'PATCH',

      body: {
        id: row.application.id,

        notes: editingNote.value.trim() || null,
      },
    });

    row.application.notes = result.notes;

    cancelEditingNote();
  } catch (error) {
    console.error('Failed to save application note:', error);
  } finally {
    savingNote.value = false;
  }
}

function handleNoteKeydown(event, row) {
  if (event.key === 'Escape') {
    cancelEditingNote();

    return;
  }

  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();

    saveNote(row);
  }
}

function selectRow(row) {
  activeRowId.value = row.id;
}

function openPacket(row, type) {
  if (!row?.id) {
    return;
  }

  window.open(`/packets/${row.id}/${type}`, '_blank', 'noopener,noreferrer');

  selectRow(row);
}
</script>

<template>
  <div class="overflow-x-auto rounded-xl border bg-white shadow-sm">
    <table class="min-w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-4 py-3 text-left text-sm font-semibold">Apply</th>

          <th
            class="cursor-pointer px-4 py-3 text-left text-sm font-semibold select-none"
            @click="emit('sort', 'fit_score')">
            Fit
          </th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Notes</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Job</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Company</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Packets</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Archive</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="row in rows"
          :key="row.id"
          class="border-t transition-colors"
          :class="activeRowId === row.id ? 'bg-gray-100' : 'hover:bg-gray-50'">
          <!-- APPLY -->

          <td class="px-4 py-3">
            <button
              type="button"
              class="rounded-lg bg-red-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              @click="
                openApplication(row);
                selectRow(row);
              ">
              <span v-if="row.application">
                {{ row.application.status }}
              </span>

              <span v-else> Apply </span>
            </button>
          </td>

          <!-- FIT -->

          <td class="px-4 py-3 font-semibold">
            {{ formatScore(row.fit_score) }}
          </td>

          <!-- NOTES -->

          <td class="max-w-xs px-4 py-3 text-sm text-gray-600">
            <div v-if="editingNoteJobId === row.id">
              <textarea
                v-model="editingNote"
                rows="3"
                autofocus
                class="w-full min-w-[220px] resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-900/5"
                :disabled="savingNote"
                @keydown="handleNoteKeydown($event, row)"
                @blur="saveNote(row)" />

              <div class="mt-1 text-xs text-gray-400">
                {{ savingNote ? 'Saving...' : 'Ctrl + Enter to save · Esc to cancel' }}
              </div>
            </div>

            <button
              v-else-if="row.application"
              type="button"
              class="w-full rounded-lg px-2 py-1.5 text-left hover:bg-gray-100"
              :title="row.application.notes || 'Add note'"
              @click="startEditingNote(row)">
              <span v-if="row.application.notes">
                {{ row.application.notes }}
              </span>

              <span v-else class="text-gray-400"> Add note... </span>
            </button>

            <span v-else class="text-gray-400"> - </span>
          </td>

          <!-- JOB -->

          <td class="px-4 py-3">
            <a
              :href="row.url"
              target="_blank"
              @click="selectRow(row)"
              rel="noopener noreferrer"
              class="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
              Job
            </a>
          </td>

          <!-- COMPANY -->

          <td class="px-4 py-3">
            {{ row.company || '-' }}
          </td>

          <!-- PACKETS -->

          <td class="px-4 py-3">
            <div class="flex gap-2">
              <button
                v-if="row.application_packet"
                type="button"
                class="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                @click="openPacket(row, 'application')">
                Resume
              </button>

              <button
                v-if="row.networking_packet"
                type="button"
                class="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                @click="openPacket(row, 'networking')">
                Network
              </button>

              <span v-if="!row.application_packet && !row.networking_packet" class="text-sm text-gray-400"> - </span>
            </div>
          </td>

          <!-- ARCHIVE -->

          <td class="px-4 py-3">
            <button
              type="button"
              class="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              @click="
                openArchive(row);
                selectRow(row);
              ">
              Archive
            </button>
          </td>
        </tr>

        <tr v-if="!loading && !rows.length">
          <td colspan="7" class="px-4 py-10 text-center text-sm text-gray-500">No jobs found.</td>
        </tr>

        <tr v-if="loading">
          <td colspan="7" class="px-4 py-10 text-center text-sm text-gray-500">Loading jobs...</td>
        </tr>
      </tbody>
    </table>
  </div>

  <ApplicationModal
    :open="showApplicationModal"
    :job="selectedJob"
    :application="selectedApplication"
    @close="closeApplication"
    @saved="handleSaved" />

  <ArchiveModal :open="showArchiveModal" :job="selectedJob" @close="closeArchive" @archived="handleArchived" />
</template>
