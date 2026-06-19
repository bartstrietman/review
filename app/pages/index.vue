<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: () => t('page.title') === 'page.title' ? 'ReviewShield' : t('page.title'),
})
useSeoMeta({
  title: 'ReviewShield — Bescherm je online reputatie',
  description: () => t('hero.lede'),
})
</script>

<template>
  <div>
    <MarketingHero />
    <MarketingTrustStrip />
    <MarketingHowItWorks />
    <MarketingBranches />
    <MarketingWidgetPreviews />
    <MarketingDemo />
    <MarketingRoiCalculator />
    <MarketingReviews />
    <MarketingPrivacy />
    <MarketingComparison />
    <MarketingPricing />
    <MarketingUrgency />
    <MarketingExitIntent />
  </div>
</template>
