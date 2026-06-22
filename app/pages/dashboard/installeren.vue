<script setup lang="ts">
// Install is now step 2 of the Widget page. Keep this route as a redirect.
const localePath = useLocalePath()
definePageMeta({ middleware: 'auth' })
await navigateTo(localePath('/dashboard/widget') + '?step=2', { redirectCode: 301 })
</script>

<template>
  <div />
</template>
