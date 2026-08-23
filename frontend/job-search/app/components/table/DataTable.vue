<script setup>
import { ref } from 'vue';

import ApplicationModal from '~/components/applications/ApplicationModal.vue';

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

const emit = defineEmits(['sort', 'application-saved']);

const selectedJob = ref(null);

const selectedApplication = ref(null);

const showApplicationModal = ref(false);

function formatScore(score) {
  if (score === null || score === undefined) {
    return '-';
  }

  return Math.round(score * 100);
}

function formatDate(date) {
  if (!date) {
    return '-';
  }

  return new Date(date).toLocaleDateString();
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

          <th class="px-4 py-3 text-left text-sm font-semibold">Notes</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Job</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Company</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Location</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Source</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Recommendation</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Application</th>

          <th class="px-4 py-3 text-left text-sm font-semibold">Notes</th>

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

          <td class="max-w-xs px-4 py-3 text-sm text-gray-600" :title="row.application?.notes || ''">
            <span v-if="row.application?.notes">
              {{ row.application.notes }}
            </span>

            <span v-else class="text-gray-400"> - </span>
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
            <button
              type="button"
              class="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
              @click="openApplication(row)">
              <span v-if="row.application">
                {{ row.application.status }}
              </span>

              <span v-else> Apply </span>
            </button>
          </td>

          <td class="max-w-xs px-4 py-3 text-sm text-gray-600" :title="row.application?.notes || ''">
            <span v-if="row.application?.notes">
              {{ row.application.notes }}
            </span>

            <span v-else class="text-gray-400"> - </span>
          </td>

          <td class="px-4 py-3">
            {{ formatDate(row.posted_at) }}
          </td>
        </tr>

        <tr v-if="!loading && !rows.length">
          <td colspan="10" class="px-4 py-10 text-center text-sm text-gray-500">No jobs found.</td>
        </tr>

        <tr v-if="loading">
          <td colspan="10" class="px-4 py-10 text-center text-sm text-gray-500">Loading jobs...</td>
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
</template>
