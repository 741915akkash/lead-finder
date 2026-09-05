<script setup>
import DataTable from '~/components/table/DataTable.vue';
import TableFilters from '~/components/table/TableFilters.vue';
import Pagination from '~/components/table/Pagination.vue';

const search = ref('');

const source = ref('');

const status = ref('');

const recommendation = ref('');

const page = ref(1);

const pageSize = ref(50);

const sort = ref('fit_score');

const order = ref('desc');

const days = ref(300);

const { data: filters } = await useFetch('/api/filters');

const { data, pending, error, refresh } = await useFetch('/api/jobs', {
  query: {
    page,
    pageSize,
    sort,
    order,
    search,
    source,
    status,
    recommendation,
    days,
  },
});

function handleSort(column) {
  if (sort.value === column) {
    order.value = order.value === 'asc' ? 'desc' : 'asc';
  } else {
    sort.value = column;

    order.value = 'desc';
  }
}

watch([search, source, status, recommendation, days], () => {
  page.value = 1;
});

async function handleApplicationSaved() {
  await refresh();
}
</script>

<template>
  <main class="min-h-screen bg-gray-100 p-8">
    <div class="mx-auto max-w-7xl">
      <h1 class="mb-6 text-3xl font-bold">Job Search</h1>

      <TableFilters
        :filters="filters"
        v-model:search="search"
        v-model:source="source"
        v-model:status="status"
        v-model:recommendation="recommendation"
        v-model:days="days" />

      <Pagination v-model:page="page" :total-pages="data?.totalPages || 1" />

      <DataTable
        :rows="data?.rows || []"
        :loading="pending"
        :sort="sort"
        :order="order"
        @sort="handleSort"
        @application-saved="handleApplicationSaved"
        @job-archived="handleApplicationSaved" />

      <Pagination v-model:page="page" :total-pages="data?.totalPages || 1" />

      <div v-if="error" class="mt-4 text-red-600">
        {{ error?.statusMessage || error?.message || 'Failed to load jobs.' }}
      </div>
    </div>
  </main>
</template>
