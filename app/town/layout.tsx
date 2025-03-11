'use client'

import { BlockchainWalletProvider } from '@/components/blockchain-wallet'

export default function TownLayout({ children }: React.PropsWithChildren) {
  return (
    <BlockchainWalletProvider>
      {children}
    </BlockchainWalletProvider>
  )
} 