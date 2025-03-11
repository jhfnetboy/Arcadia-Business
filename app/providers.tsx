'use client'

import { ReactNode } from 'react'
import { HeroProvider } from '@/lib/hero-context'
import { BlockchainWalletProvider } from '@/components/blockchain-wallet'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <BlockchainWalletProvider>
      <HeroProvider>
        {children}
      </HeroProvider>
    </BlockchainWalletProvider>
  )
} 