<script setup>
defineProps({
  status: {
    type: String,
    default: '',
  },
});

const labels = {
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

const classes = {
  applied: 'bg-blue-50 text-blue-700 border-blue-200',

  interview: 'bg-yellow-50 text-yellow-700 border-yellow-200',

  offer: 'bg-green-50 text-green-700 border-green-200',

  rejected: 'bg-red-50 text-red-700 border-red-200',
};
</script>

<template>
  <span
    v-if="status"
    :class="[
      'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
      classes[status] || 'bg-gray-50 text-gray-700 border-gray-200',
    ]">
    {{ labels[status] || status }}
  </span>

  <span v-else class="text-gray-400"> — </span>
</template>
