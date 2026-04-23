// @ts-nocheck
'use client'
import FeatureGate from '@/components/FeatureGate'
export default function Layout({ children }) {
  return <FeatureGate featureId="organigrama">{children}</FeatureGate>
}
