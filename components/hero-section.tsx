'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'

interface User {
  name?: string | null
  email?: string | null
  image?: string | null
}

interface Hero {
  name: string
  points: number
  level: number
  userId: string
  createdAt: string
  txHash?: string
}

interface HeroSectionProps {
  user: User
}

export default function HeroSection({ user }: HeroSectionProps) {
  const [heroName, setHeroName] = useState('')
  const [hero, setHero] = useState<Hero | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // 加载英雄数据
  useEffect(() => {
    const fetchHero = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/hero/get')
        const data = await response.json()
        
        if (data.success && data.hero) {
          setHero(data.hero)
        }
      } catch (error) {
        console.error('Error fetching hero:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHero()
  }, [])

  // 创建英雄
  const createHero = async () => {
    if (!heroName.trim()) {
      toast.error('Please enter a hero name')
      return
    }

    setIsCreating(true)
    
    try {
      // 创建英雄数据
      const newHero: Hero = {
        name: heroName,
        points: 0,
        level: 1,
        userId: user.email || 'unknown',
        createdAt: new Date().toISOString()
      }
      
      // 保存到服务器
      const response = await fetch('/api/hero/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newHero),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setHero(newHero)
        toast.success(`Hero ${heroName} created!`)
      } else {
        toast.error('Failed to create hero')
      }
    } catch (error) {
      console.error('Error creating hero:', error)
      toast.error('Error creating hero')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="h-64">
      <CardHeader>
        <CardTitle>Your Heroes</CardTitle>
        <CardDescription>Manage your game heroes</CardDescription>
      </CardHeader>
      
      <CardContent className="h-24">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading hero data...</p>
          </div>
        ) : hero ? (
          <div className="space-y-2">
            <p><strong>Name:</strong> {hero.name}</p>
            <p><strong>Level:</strong> {hero.level} | <strong>Points:</strong> {hero.points}</p>
            {hero.txHash && (
              <p className="text-xs text-green-600">
                <strong>Blockchain TX:</strong> {hero.txHash.substring(0, 10)}...
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <Input
              type="text"
              placeholder="Enter hero name"
              value={heroName}
              onChange={(e) => setHeroName(e.target.value)}
              className="flex-1"
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {hero ? (
          <Link href="/town/play" className="w-full">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Play Game
            </Button>
          </Link>
        ) : (
          <Button 
            onClick={createHero} 
            disabled={isCreating || !heroName.trim()}
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create Hero'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 