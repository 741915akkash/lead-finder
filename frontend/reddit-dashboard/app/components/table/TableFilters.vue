<script setup>
const search = defineModel('search');
const keyword = defineModel('keyword');
const subreddit = defineModel('subreddit');
const source = defineModel('source');
const status = defineModel('status');
const days = defineModel('days');
defineProps({
  filters: Object,
});
</script>

<template>
  <div class="mb-6 flex flex-wrap gap-3">
    <input v-model="search" placeholder="Search title..." class="rounded-lg border px-3 py-2" />

    <select v-model="keyword">
      <option value="">All Keywords</option>

      <option v-for="item in filters?.keywords" :key="item" :value="item">
        {{ item }}
      </option>
    </select>

    <select v-model="subreddit">
      <option value="">All Subreddits</option>

      <option v-for="item in filters?.subreddits" :key="item" :value="item">
        {{ item }}
      </option>
    </select>

    <select v-model="source">
      <option value="">All Sources</option>

      <option v-for="item in filters?.sources" :key="item" :value="item">
        {{ item }}
      </option>
    </select>
    <label class="flex flex-col gap-1">

      <input v-model.number="days" placeholder="upto 7 days old" type="number" min="1" class="rounded border p-1" />
    </label>
  </div>
</template>
