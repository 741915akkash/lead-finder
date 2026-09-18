<script setup>
import { computed, ref, watch } from 'vue';

import ApplicationStatus from './ApplicationStatus.vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },

  job: {
    type: Object,
    default: null,
  },

  application: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close', 'saved']);

const saving = ref(false);

const savingStatus = ref(false);

const loadingContacts = ref(false);

const error = ref('');

const contacts = ref([]);

const form = ref({
  status: 'seen',
  notes: '',
});

const isEditing = computed(() => !!props.application);

const company = computed(() => props.job?.company || '');

const crmUrl = computed(() => {
  const base = 'https://www.golaunchscall.com/crm';

  if (!company.value) {
    return base;
  }

  return `${base}?search=${encodeURIComponent(company.value)}`;
});

function resetForm() {
  error.value = '';

  form.value = {
    status: props.application?.status || 'seen',
    notes: props.application?.notes || '',
  };
}

function getContactIds() {
  return (props.application?.application_contacts || []).map((contact) => contact.crm_lead_id).filter(Boolean);
}

async function loadContacts() {
  const ids = getContactIds();

  if (!ids.length) {
    contacts.value = [];

    return;
  }

  loadingContacts.value = true;

  try {
    contacts.value = await $fetch('/api/crm-contacts', {
      query: {
        ids: ids.join(','),
      },
    });
  } catch (err) {
    error.value = err?.data?.statusMessage || err?.message || 'Could not load CRM contacts.';
  } finally {
    loadingContacts.value = false;
  }
}

function openCrm() {
  window.open(crmUrl.value, '_blank', 'noopener,noreferrer');
}

async function saveStatus() {
  if (!props.job?.id || savingStatus.value) {
    return;
  }

  savingStatus.value = true;

  error.value = '';

  try {
    let result;

    // Existing application → update it
    if (props.application?.id) {
      result = await $fetch('/api/applications/update', {
        method: 'PATCH',

        body: {
          id: props.application.id,
          status: form.value.status,
        },
      });
    }

    // No application yet → create it
    else {
      result = await $fetch('/api/applications/create', {
        method: 'POST',

        body: {
          job_posting_id: props.job.id,
          status: form.value.status,
          notes: form.value.notes || null,
          contacts: [],
        },
      });
    }

    emit('saved', result);

    // Close only after the save/create request succeeds.
    emit('close');
  } catch (err) {
    error.value =
      err?.data?.statusMessage || err?.data?.message || err?.message || 'Could not save application status.';
  } finally {
    savingStatus.value = false;
  }
}

async function save() {
  if (!props.job?.id || saving.value) {
    return;
  }

  saving.value = true;

  error.value = '';

  try {
    const payload = {
      status: form.value.status,
      notes: form.value.notes || null,
    };

    let result;

    if (isEditing.value) {
      result = await $fetch('/api/applications/update', {
        method: 'PATCH',

        body: {
          id: props.application.id,

          ...payload,
        },
      });
    } else {
      result = await $fetch('/api/applications/create', {
        method: 'POST',

        body: {
          job_posting_id: props.job.id,

          ...payload,

          contacts: [],
        },
      });
    }

    emit('saved', result);
  } catch (err) {
    error.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Could not save application.';
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }

    resetForm();

    await loadContacts();
  },
);
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-4 backdrop-blur-sm"
    @click.self="emit('close')">
    <div class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
      <!-- HEADER -->

      <div class="border-b border-gray-100 px-6 py-5">
        <div class="flex items-start justify-between">
          <div class="min-w-0">
            <h2 class="text-xl font-semibold tracking-tight text-gray-900">
              {{ isEditing ? 'Application' : 'Add Application' }}
            </h2>

            <p class="mt-1.5 truncate text-sm text-gray-500">
              {{ job?.title }}

              <span v-if="job?.company"> · {{ job.company }} </span>
            </p>
          </div>

          <button
            type="button"
            class="ml-4 shrink-0 rounded-lg px-2 py-1 text-xl leading-none text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            @click="emit('close')">
            ×
          </button>
        </div>
      </div>

      <!-- BODY -->

      <div class="space-y-6 px-6 py-6">
        <!-- ERROR -->

        <div v-if="error" class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ error }}
        </div>

        <!-- STATUS -->

        <div>
          <div class="mb-2 flex items-center justify-between">
            <label class="block text-sm font-medium text-gray-800"> Application status </label>

            <span v-if="savingStatus" class="text-xs text-gray-400"> Saving... </span>
          </div>

          <select
            v-model="form.status"
            :disabled="savingStatus"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900/5 disabled:cursor-not-allowed disabled:opacity-60"
            @change="saveStatus">
            <option value="seen">Seen</option>

            <option value="applied">Applied</option>

            <option value="interview">Interview</option>

            <option value="offer">Offer</option>

            <option value="rejected">Rejected</option>
          </select>

          <div class="mt-2.5">
            <ApplicationStatus :status="form.status" />
          </div>
        </div>

        <!-- CONTACTS -->

        <div>
          <div class="mb-3 flex items-center justify-between">
            <label class="text-sm font-medium text-gray-800"> Contacts </label>

            <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
              {{ contacts.length }} linked
            </span>
          </div>

          <div
            v-if="loadingContacts"
            class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
            Loading contacts...
          </div>

          <div v-else-if="contacts.length" class="space-y-2">
            <div
              v-for="contact in contacts"
              :key="contact.id"
              class="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-gray-900">
                  {{ contact.name || 'Unnamed contact' }}
                </div>

                <div class="mt-0.5 truncate text-xs text-gray-500">
                  {{ contact.company || '' }}

                  <span v-if="contact.email">
                    ·
                    {{ contact.email }}
                  </span>
                </div>
              </div>

              <span
                class="ml-3 shrink-0 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
                {{ contact.stage || 'No stage' }}
              </span>
            </div>
          </div>

          <div
            v-else
            class="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
            No contacts linked yet.
          </div>

          <button
            type="button"
            class="mt-3 w-full rounded-lg bg-green-600 px-3 py-5 text-sm font-medium text-white transition hover:bg-green-700"
            @click="openCrm">
            Open CRM

            <span v-if="company"> — {{ company }} </span>
          </button>
        </div>

        <!-- NOTES -->

        <div>
          <label class="mb-2 block text-sm font-medium text-gray-800"> Notes </label>

          <textarea
            v-model="form.notes"
            rows="4"
            placeholder="Application notes..."
            class="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-900/5" />
        </div>
      </div>

      <!-- FOOTER -->

      <div class="flex justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
        <button
          type="button"
          class="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
          @click="emit('close')">
          Cancel
        </button>

        <button
          type="button"
          :disabled="saving || savingStatus"
          class="rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          @click="save">
          {{ saving ? 'Saving...' : 'Save Application' }}
        </button>
      </div>
    </div>
  </div>
</template>
