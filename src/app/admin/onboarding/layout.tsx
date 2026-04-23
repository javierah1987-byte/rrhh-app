// @ts-nocheck
'use client'
import FeatureGate from '@/components/FeatureGate'
export default function Layout({ children }) {
  return <FeatureGate featureId="onboarding">{children}</FeatureGate>
}
