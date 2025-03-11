'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import GlobalWalletConnect from '@/components/global-wallet-connect'
import { useHero, Hero } from '@/lib/hero-context'

export default function PlayPage() {
  const { hero } = useHero()
  const searchParams = useSearchParams()
  const [localHero, setLocalHero] = useState<Hero | null>(null)
  
  // 从URL参数或Context获取英雄信息
  useEffect(() => {
    if (hero) {
      // 优先使用Context中的英雄
      setLocalHero(hero)
      console.log('Using hero from context:', hero)
    } else if (searchParams) {
      // 如果Context中没有英雄，尝试从URL参数获取
      const heroId = searchParams.get('heroId')
      const heroName = searchParams.get('heroName')
      const heroLevel = searchParams.get('heroLevel')
      const heroPoints = searchParams.get('heroPoints')
      const network = searchParams.get('network')
      
      if (heroId && heroName) {
        const urlHero: Hero = {
          tokenId: heroId,
          name: heroName,
          level: heroLevel ? parseInt(heroLevel) : 1,
          points: heroPoints ? parseInt(heroPoints) : 0,
          userId: 'from-url',
          createdAt: new Date().toISOString(),
          network: network || 'unknown'
        }
        
        setLocalHero(urlHero)
        console.log('Using hero from URL params:', urlHero)
      }
    }
  }, [hero, searchParams])
  
  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Game Play</h1>
          {localHero && <p>Playing with hero: {localHero.name}</p>}
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/town">
            <Button variant="outline">Back to Town</Button>
          </Link>
          
          {/* Global Wallet Connection */}
          <GlobalWalletConnect />
        </div>
      </div>
      
      {localHero ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Hero Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Hero Information</CardTitle>
              <CardDescription>Your hero's stats and abilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p><strong>Name:</strong> {localHero.name}</p>
                  <p><strong>Level:</strong> {localHero.level}</p>
                  <p><strong>Points:</strong> {localHero.points}</p>
                  {localHero.tokenId && (
                    <p><strong>Token ID:</strong> {localHero.tokenId}</p>
                  )}
                  {localHero.network && (
                    <p><strong>Network:</strong> {localHero.network}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled>Train Hero</Button>
            </CardFooter>
          </Card>
          
          {/* Game Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Game Actions</CardTitle>
              <CardDescription>Choose your adventure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" disabled>Start Quest</Button>
              <Button className="w-full" disabled>Battle Arena</Button>
              <Button className="w-full" disabled>Explore Map</Button>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-gray-500">Game features coming soon!</p>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No Hero Selected</h2>
          <p className="mb-6">Please select a hero from the town page to play the game.</p>
          <Link href="/town">
            <Button>Return to Town</Button>
          </Link>
        </div>
      )}
      
      {/* Debug Info Area */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-lg font-medium mb-2">Debug Information</h3>
        <div id="debug-container" className="text-xs text-gray-700 max-h-60 overflow-y-auto">
          <p>Debug information will appear here</p>
        </div>
      </div>
    </div>
  )
}