<script setup lang="ts">
const { t } = useI18n()
const { siteName } = useSite()

useSeoMeta({
  title: () => `${siteName.value} — ${t('page.tagline')}`,
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
