<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <nav class="border-b border-gray-200 bg-white">
      <div class="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 md:px-8">
        <NuxtLink
          to="/"
          class="text-sm font-medium text-gray-600 transition hover:text-blue-600"
          active-class="!text-blue-600">
          Jobs
        </NuxtLink>

        <NuxtLink
          to="/links"
          class="text-sm font-medium text-gray-600 transition hover:text-blue-600"
          active-class="!text-blue-600">
          Links
        </NuxtLink>
      </div>
    </nav>

    <NuxtPage />
  </div>
</template>
