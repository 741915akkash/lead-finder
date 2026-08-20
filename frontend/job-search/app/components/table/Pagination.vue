<script setup>
defineProps({
  page: Number,
  totalPages: Number,
});

const emit = defineEmits(['update:page']);
</script>

<template>
  <div v-if="totalPages > 1" class="flex justify-center py-4">
    <div class="flex flex-wrap items-center justify-center gap-2">
      <button
        v-for="n in totalPages"
        :key="n"
        @click="$emit('update:page', n)"
        :class="['rounded border px-3 py-2', n === page && 'bg-yellow-500 text-white']">
        {{ n }}
      </button>
    </div>
  </div>
</template>
