'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MetamaskConnector from './metamask-connector'
import PetraConnector from './petra-connector'
import { ETHEREUM_CONTRACTS, APTOS_CONTRACTS, TOKEN_SYMBOLS } from '@/lib/constants'

export default function WalletSection() {
  const [activeTab, setActiveTab] = useState('ethereum')
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <Tabs defaultValue="ethereum" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
          <TabsTrigger value="aptos">Aptos</TabsTrigger>
        </TabsList>
        <TabsContent value="ethereum" className="mt-4">
          <MetamaskConnector 
            tokenContractAddress={ETHEREUM_CONTRACTS.HERO_COIN_ADDRESS}
            tokenSymbol={TOKEN_SYMBOLS.ETHEREUM}
          />
        </TabsContent>
        <TabsContent value="aptos" className="mt-4">
          <PetraConnector 
            tokenAddress={APTOS_CONTRACTS.MOVE_HERO_COIN_ADDRESS}
            tokenSymbol={TOKEN_SYMBOLS.APTOS}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 