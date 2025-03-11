'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useBlockchainWallet } from './blockchain-wallet'
import { APTOS_CONTRACTS } from '@/lib/constants'
import { useHero } from '@/lib/hero-context'

// 用户类型定义
interface User {
  name?: string | null
  email?: string | null
  image?: string | null
}

// 英雄类型定义
interface Hero {
  name: string
  points: number
  level: number
  userId: string
  createdAt: string
  tokenId?: string
  txHash?: string
  network: string
}

// NFT 类型定义
interface NFT {
  tokenId: string
  tokenURI?: string
  metadata?: any
}

// 组件属性类型
interface HeroSectionProps {
  user: User
}

export default function HeroSectionAptos({ user }: HeroSectionProps) {
  const { aptosAddress, currentNetwork } = useBlockchainWallet()
  const { setHero: setGlobalHero } = useHero()
  
  const [hero, setHero] = useState<Hero | null>(null)
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null)
  const [heroName, setHeroName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [contractError, setContractError] = useState<string | null>(null)
  const [heroNotFound, setHeroNotFound] = useState(false)
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
  
  // 监听钱包事件
  useEffect(() => {
    const handleWalletEvent = (event: any) => {
      if (event.detail && event.detail.type === 'connect') {
        const { address, network } = event.detail
        addDebugInfo(`Received wallet event: ${network} wallet connected with address ${address}`)
        
        // 如果是Aptos钱包连接，重置状态
        if (network === 'aptos') {
          setHero(null)
          setContractError(null)
          setHeroNotFound(false)
          setSelectedNft(null)
        }
      }
    }
    
    // 添加事件监听器
    document.addEventListener('walletEvent', handleWalletEvent)
    
    // 清理函数
    return () => {
      document.removeEventListener('walletEvent', handleWalletEvent)
    }
  }, [])
  
  // 监听NFT选择事件
  useEffect(() => {
    const handleNftSelect = (event: any) => {
      if (event.detail && event.detail.nft) {
        const nft = event.detail.nft
        addDebugInfo(`Received selectNFT event for token ID: ${nft.tokenId}`)
        setSelectedNft(nft)
        
        // 重置状态
        setHero(null)
        setContractError(null)
        setHeroNotFound(false)
      }
    }
    
    // 添加事件监听器
    document.addEventListener('selectNFT', handleNftSelect)
    
    // 清理函数
    return () => {
      document.removeEventListener('selectNFT', handleNftSelect)
    }
  }, [])
  
  // 加载选中 NFT 的英雄信息
  useEffect(() => {
    const loadHeroInfo = async () => {
      if (!selectedNft || !aptosAddress) return
      
      setIsLoading(true)
      setContractError(null)
      setHeroNotFound(false)
      setHero(null)
      
      try {
        addDebugInfo(`Getting hero info for Aptos NFT with token ID: ${selectedNft.tokenId}`)
        
        // 模拟从API获取英雄信息
        const response = await fetch(`/api/heroes?tokenId=${selectedNft.tokenId}&userId=${user.email}`)
        
        if (response.ok) {
          const data = await response.json()
          
          if (data && data.length > 0) {
            // 找到了英雄
            const heroData = data[0]
            setHero(heroData)
            addDebugInfo(`Found hero in API: ${JSON.stringify(heroData)}`)
          } else {
            // 没有找到英雄，允许创建
            setHeroNotFound(true)
            addDebugInfo('Hero not found in API, allowing creation')
          }
        } else {
          // API错误
          const errorText = await response.text()
          setContractError(`API Error: ${errorText}`)
          setHeroNotFound(true)
          addDebugInfo(`API Error: ${errorText}`)
        }
      } catch (error) {
        console.error('Error loading hero info:', error)
        setContractError(`Error loading hero info: ${error instanceof Error ? error.message : String(error)}`)
        setHeroNotFound(true)
        addDebugInfo(`Error loading hero info: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (selectedNft && aptosAddress) {
      addDebugInfo(`Triggering loadHeroInfo for token ID: ${selectedNft.tokenId}`)
      loadHeroInfo()
    }
  }, [selectedNft, aptosAddress, user.email])
  
  // 保存英雄到 API
  const saveHero = async (hero: Hero) => {
    setIsCreating(true)
    
    try {
      addDebugInfo(`Saving hero to API: ${JSON.stringify(hero)}`)
      
      const response = await fetch('/api/heroes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hero),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${errorText}`)
      }
      
      const result = await response.json()
      addDebugInfo(`Hero saved successfully: ${JSON.stringify(result)}`)
      
      // 添加网络信息
      const heroWithNetwork = {
        ...hero,
        network: 'aptos'
      }
      
      setHero(heroWithNetwork)
      setGlobalHero(heroWithNetwork) // 设置全局英雄
      setHeroNotFound(false)
      return result
    } catch (error) {
      console.error('Error saving hero:', error)
      addDebugInfo(`Error saving hero: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    } finally {
      setIsCreating(false)
    }
  }
  
  // 创建英雄
  const createHero = () => {
    if (!selectedNft) return
    
    const newHero: Hero = {
      name: heroName || `Aptos Hero #${selectedNft.tokenId}`,
      points: 0,
      level: 1,
      userId: user.email || 'unknown',
      createdAt: new Date().toISOString(),
      tokenId: selectedNft.tokenId,
      network: 'aptos'
    }
    
    addDebugInfo(`Creating hero: ${JSON.stringify(newHero)}`)
    saveHero(newHero).catch(error => {
      console.error('Error saving hero:', error)
      setContractError(`Error saving hero: ${error instanceof Error ? error.message : String(error)}`)
    })
  }
  
  return (
    <div className="space-y-6">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Your Aptos Heroes</CardTitle>
          <CardDescription>Manage your Aptos game heroes</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* 合约错误信息 */}
            {contractError && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                <p className="font-medium">Contract Error</p>
                <p className="text-xs mt-1">{contractError}</p>
                {heroNotFound && (
                  <p className="text-xs mt-2">No hero found for this NFT. You can create a new one.</p>
                )}
              </div>
            )}
            
            {/* 英雄信息 */}
            {isLoading && selectedNft ? (
              <div className="flex items-center justify-center h-24">
                <p>Loading hero information...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {hero ? (
                  <div className="space-y-2">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p><strong>Name:</strong> {hero.name}</p>
                      <p><strong>Level:</strong> {hero.level} | <strong>Points:</strong> {hero.points}</p>
                      {hero.tokenId && (
                        <p className="text-xs text-green-600">
                          <strong>Token ID:</strong> {hero.tokenId}
                        </p>
                      )}
                    </div>
                  </div>
                ) : selectedNft && heroNotFound ? (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Enter hero name"
                      value={heroName}
                      onChange={(e) => setHeroName(e.target.value)}
                      className="w-full"
                    />
                    <Button
                      onClick={createHero}
                      disabled={isCreating}
                      className="w-full"
                    >
                      {isCreating ? 'Creating Hero...' : 'Create Aptos Hero with Selected NFT'}
                    </Button>
                  </div>
                ) : selectedNft ? (
                  <p className="text-sm text-gray-500">Checking hero information...</p>
                ) : (
                  <p className="text-sm text-gray-500">Select an Aptos NFT to view or create a hero</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter>
          {hero ? (
            <Link 
              href="/town/play"
              className="w-full"
              onClick={() => setGlobalHero({...hero, network: 'aptos'})}
            >
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Play Game
              </Button>
            </Link>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  )
} 