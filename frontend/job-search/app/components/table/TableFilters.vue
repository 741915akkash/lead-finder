<script setup>
const search = defineModel('search');
const source = defineModel('source');
const status = defineModel('status');
const recommendation = defineModel('recommendation');
const days = defineModel('days');

defineProps({
  filters: Object,
});
</script>

<template>
  <div class="mb-6 flex flex-wrap gap-3">
    <input v-model="search" placeholder="Search jobs..." class="rounded-lg border px-3 py-2" />

    <select v-model="source" class="rounded-lg border px-3 py-2">
      <option value="">All Sources</option>

      <option v-for="item in filters?.sources" :key="item" :value="item">
        {{ item }}
      </option>
    </select>

    <select v-model="recommendation" class="rounded-lg border px-3 py-2">
      <option value="">All Recommendations</option>

      <option v-for="item in filters?.recommendations" :key="item" :value="item">
        {{ item }}
      </option>
    </select>

    <select v-model="status" class="rounded-lg border px-3 py-2">
      <option value="">All Statuses</option>

      <option v-for="item in filters?.statuses" :key="item" :value="item">
        {{ item }}
      </option>
    </select>

    <input v-model.number="days" type="number" min="1" placeholder="Days" class="w-24 rounded-lg border px-3 py-2" />
  </div>
</template>
