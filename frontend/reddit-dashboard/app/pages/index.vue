<script setup>
// const { data, pending, error } = await useFetch(
//   'http://localhost:3000/api/posts?page=1&pageSize=50'
// )

const search = ref('');
const keyword = ref('');
const subreddit = ref('');
const source = ref('');

const page = ref(1);
const pageSize = ref(50);

const sort = ref('score');
const order = ref('desc');

const { data: filters } = await useFetch('/api/filters');

const { data, pending } = await useFetch('/api/posts', {
  query: {
    page,
    pageSize,

    sort,
    order,

    search,
    keyword,
    subreddit,
    source,
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

import DataTable from '~/components/table/DataTable.vue';
import TableFilters from '~/components/table/TableFilters.vue';
</script>

<template>
  <main class="min-h-screen bg-gray-100 p-8">
    <div class="mx-auto max-w-7xl">
      <h1 class="mb-6 text-3xl font-bold">Reddit Leads</h1>

      <TableFilters
        :filters="filters"
        v-model:search="search"
        v-model:keyword="keyword"
        v-model:subreddit="subreddit"
        v-model:source="source" />

      <DataTable :rows="data?.rows || []" :loading="pending" :sort="sort" :order="order" @sort="handleSort" />

      <div v-if="error" class="mt-4 text-red-600">
        {{ error }}
      </div>
    </div>
  </main>
</template>
