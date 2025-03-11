'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useBlockchainWallet } from './blockchain-wallet'
import NFTCard from './nft-card'
import { APTOS_CONTRACTS } from '@/lib/constants'

// NFT 类型定义
interface NFT {
  tokenId: string
  tokenURI?: string
  metadata?: any
}

export default function NFTSectionAptos() {
  const { aptosAddress, currentNetwork } = useBlockchainWallet()
  
  const [nfts, setNfts] = useState<NFT[]>([])
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  
  // 添加调试信息
  const addDebugInfo = (info: string) => {
    console.log(info)
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
    
    // 同时添加到全局调试区域
    const debugContainer = document.getElementById('debug-container')
    if (debugContainer) {
      const debugElement = document.createElement('p')
      debugElement.className = 'mb-1'
      debugElement.textContent = `${new Date().toLocaleTimeString()}: ${info}`
      debugContainer.appendChild(debugElement)
      debugContainer.scrollTop = debugContainer.scrollHeight
    }
  }
  
  // 处理NFT选择
  const handleSelectNft = (nft: NFT) => {
    setSelectedNft(nft)
    addDebugInfo(`Selected NFT: ${nft.tokenId}`)
    
    // 触发自定义事件，通知其他组件
    try {
      // 创建带有NFT数据的事件
      const event = new CustomEvent('selectNFT', { 
        detail: { nft },
        bubbles: true,
        cancelable: true
      })
      
      // 分发事件
      document.dispatchEvent(event)
      addDebugInfo(`Dispatched selectNFT event for token ID: ${nft.tokenId}`)
    } catch (error) {
      console.error('Error dispatching selectNFT event:', error)
      addDebugInfo(`Error dispatching selectNFT event: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  // 加载用户的 NFT
  useEffect(() => {
    const loadNFTs = async () => {
      if (!aptosAddress) {
        setNfts([])
        return
      }
      
      setIsLoading(true)
      addDebugInfo(`Loading NFTs for Aptos address: ${aptosAddress}`)
      
      try {
        // 创建一些模拟的 NFT 数据用于测试
        const sampleNfts: NFT[] = []
        
        for (let i = 1; i <= 4; i++) {
          const tokenId = `${i}`
          const metadata = {
            name: `Aptos NFT #${i}`,
            description: `This is a sample Aptos NFT #${i}`,
            image: `https://via.placeholder.com/150?text=Aptos+NFT+${i}`
          }
          
          sampleNfts.push({
            tokenId,
            tokenURI: `ipfs://sample/${i}`,
            metadata
          })
        }
        
        addDebugInfo('Created sample Aptos NFTs for testing')
        setNfts(sampleNfts)
      } catch (error) {
        console.error('Error initializing Aptos NFT contract:', error)
        addDebugInfo(`Error initializing Aptos NFT contract: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadNFTs()
  }, [aptosAddress, currentNetwork])
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Your Aptos NFTs</CardTitle>
        <CardDescription>View and manage your Aptos NFT collection</CardDescription>
      </CardHeader>
      <CardContent>
        <NFTCard 
          nfts={nfts}
          onSelectNft={handleSelectNft}
          selectedNftId={selectedNft?.tokenId}
          ethereumAddress={aptosAddress || ''}
          isLoading={isLoading}
          currentNetwork={currentNetwork || ''}
        />
      </CardContent>
    </Card>
  )
} 