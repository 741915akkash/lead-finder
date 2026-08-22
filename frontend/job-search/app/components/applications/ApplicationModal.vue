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

const loadingContacts = ref(false);

const error = ref('');

const contacts = ref([]);

const form = ref({
  status: 'applied',
  applied_at: '',
  application_url: '',
  resume_version: '',
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

function toDatetimeLocal(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();

  const local = new Date(date.getTime() - offset * 60000);

  return local.toISOString().slice(0, 16);
}

function resetForm() {
  error.value = '';

  form.value = {
    status: props.application?.status || 'applied',

    applied_at: toDatetimeLocal(props.application?.applied_at || new Date()),

    application_url: props.application?.application_url || props.job?.apply_url || props.job?.url || '',

    resume_version: props.application?.resume_version || '',

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

async function save() {
  if (!props.job?.id) {
    return;
  }

  saving.value = true;

  error.value = '';

  try {
    const payload = {
      status: form.value.status,

      applied_at: form.value.applied_at ? new Date(form.value.applied_at).toISOString() : null,

      application_url: form.value.application_url || null,

      resume_version: form.value.resume_version || null,

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
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    @click.self="emit('close')">
    <div class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl">
      <!-- HEADER -->

      <div class="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'Application' : 'Add Application' }}
          </h2>

          <p class="mt-1 text-sm text-gray-500">
            {{ job?.title }}

            <span v-if="job?.company"> · {{ job.company }} </span>
          </p>
        </div>

        <button
          type="button"
          class="rounded-lg px-2 py-1 text-xl text-gray-400 hover:bg-gray-100"
          @click="emit('close')">
          ×
        </button>
      </div>

      <div class="space-y-5 px-6 py-5">
        <!-- ERROR -->

        <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ error }}
        </div>

        <!-- STATUS -->

        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700"> Application status </label>

          <select v-model="form.status" class="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="applied">Applied</option>

            <option value="interview">Interview</option>

            <option value="offer">Offer</option>

            <option value="rejected">Rejected</option>
          </select>

          <div class="mt-2">
            <ApplicationStatus :status="form.status" />
          </div>
        </div>

        <!-- CONTACTS -->

        <div>
          <div class="mb-3 flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700"> Contacts </label>

            <span class="text-xs text-gray-400">
              {{ contacts.length }}
              linked
            </span>
          </div>

          <div v-if="loadingContacts" class="rounded-lg border bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Loading contacts...
          </div>

          <div v-else-if="contacts.length" class="space-y-2">
            <div
              v-for="contact in contacts"
              :key="contact.id"
              class="flex items-center justify-between rounded-lg border px-3 py-2">
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-gray-900">
                  {{ contact.name || 'Unnamed contact' }}
                </div>

                <div class="truncate text-xs text-gray-500">
                  {{ contact.company || '' }}

                  <span v-if="contact.email">
                    ·
                    {{ contact.email }}
                  </span>
                </div>
              </div>

              <span class="ml-3 shrink-0 rounded-full border bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                {{ contact.stage || 'No stage' }}
              </span>
            </div>
          </div>

          <div v-else class="rounded-lg border border-dashed bg-gray-50 px-4 py-4 text-sm text-gray-500">
            No contacts linked yet.
          </div>

          <button
            type="button"
            class="mt-3 w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            @click="openCrm">
            Open CRM
            <span v-if="company"> — {{ company }} </span>
          </button>
        </div>

        <!-- APPLIED DATE -->

        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700"> Applied at </label>

          <input
            v-model="form.applied_at"
            type="datetime-local"
            class="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>

        <!-- URL -->

        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700"> Application URL </label>

          <input
            v-model="form.application_url"
            type="url"
            placeholder="https://..."
            class="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>

        <!-- RESUME -->

        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700"> Resume version </label>

          <input
            v-model="form.resume_version"
            type="text"
            placeholder="e.g. Master Resume"
            class="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>

        <!-- NOTES -->

        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700"> Notes </label>

          <textarea
            v-model="form.notes"
            rows="4"
            placeholder="Application notes..."
            class="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>
      </div>

      <!-- FOOTER -->

      <div class="flex justify-end gap-3 border-t px-6 py-4">
        <button type="button" class="rounded-lg border px-4 py-2 text-sm" @click="emit('close')">Cancel</button>

        <button
          type="button"
          :disabled="saving"
          class="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          @click="save">
          {{ saving ? 'Saving...' : 'Save Application' }}
        </button>
      </div>
    </div>
  </div>
</template>
