<template>
  <footer class="border-t border-border py-10">
    <div class="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-5">
      <AppLogo size="md" />
      <nav class="flex items-center gap-6 text-sm text-muted-foreground">
        <NuxtLink
          :to="localePath('/blog')"
          class="hover:text-foreground transition-colors"
        >
          {{ t('header.navigation.blog') }}
        </NuxtLink>
        <NuxtLink
          :to="localePath('/pricing')"
          class="hover:text-foreground transition-colors"
        >
          {{ t('header.navigation.pricing') }}
        </NuxtLink>
      </nav>
      <p class="text-sm text-muted-foreground">
        {{ t('home.footer.copyright', { year: new Date().getFullYear() }) }}
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Site-wide footer for all default-layout pages: logo, primary navigation, copyright.
const { t } = useI18n()
const localePath = useLocalePath()
</script>
