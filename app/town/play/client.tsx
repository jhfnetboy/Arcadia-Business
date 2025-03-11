'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import BlockchainConnector from '@/components/blockchain-connector'

// 定义英雄数据类型
interface Hero {
  name: string
  points: number
  level: number
  userId: string
  createdAt: string
  txHash?: string
}

// 定义用户类型
interface User {
  name?: string | null
  email?: string | null
  image?: string | null
}

// 客户端组件接口
interface PlayGameClientProps {
  user: User
}

export default function PlayGameClient({ user }: PlayGameClientProps) {
  const router = useRouter()
  const [heroName, setHeroName] = useState('')
  const [hero, setHero] = useState<Hero | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [gameLoaded, setGameLoaded] = useState(false)

  // 创建英雄
  const createHero = () => {
    if (!heroName.trim()) {
      toast.error('Please enter a hero name')
      return
    }

    setIsLoading(true)
    
    // 创建英雄数据
    const newHero: Hero = {
      name: heroName,
      points: 0,
      level: 1,
      userId: user.email || 'unknown',
      createdAt: new Date().toISOString()
    }
    
    // 设置英雄数据
    setHero(newHero)
    setIsLoading(false)
    toast.success(`Hero ${heroName} created!`)
  }

  // 当英雄数据变化时，通过 postMessage 发送到游戏
  useEffect(() => {
    if (hero && gameLoaded) {
      try {
        const iframe = document.getElementById('game-iframe') as HTMLIFrameElement
        
        // 确保 iframe 已加载并且可以访问
        if (iframe && iframe.contentWindow) {
          // 发送英雄数据到游戏
          iframe.contentWindow.postMessage({
            type: 'HERO_DATA',
            payload: hero
          }, '*') // 在生产环境中应该指定确切的域名
          
          console.log('Hero data sent to game:', hero)
        } else {
          console.warn('Game iframe not ready yet')
        }
      } catch (error) {
        console.error('Error sending data to game:', error)
      }
    }
  }, [hero, gameLoaded])

  // 监听来自游戏的消息
  useEffect(() => {
    const handleGameMessage = async (event: MessageEvent) => {
      try {
        // 验证消息来源（在生产环境中应该更严格）
        const data = event.data
        
        // 处理游戏加载完成的消息
        if (data && data.type === 'GAME_LOADED') {
          console.log('Game reported as loaded')
          setGameLoaded(true)
          
          // 如果已经有英雄数据，发送到游戏
          if (hero) {
            try {
              const iframe = document.getElementById('game-iframe') as HTMLIFrameElement
              if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                  type: 'HERO_DATA',
                  payload: hero
                }, '*')
                console.log('Hero data sent to game after GAME_LOADED message:', hero)
              }
            } catch (error) {
              console.error('Error sending data to game after GAME_LOADED:', error)
            }
          }
        }
        
        // 处理保存英雄数据的消息
        if (data && data.type === 'SAVE_HERO') {
          console.log('Received save request from game:', data.payload)
          
          try {
            // 调用 API 保存英雄数据
            const response = await fetch('/api/hero/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data.payload),
            })
            
            const result = await response.json()
            
            if (result.success) {
              toast.success('Hero data saved successfully!')
              // 更新本地英雄数据
              setHero(data.payload as Hero)
            } else {
              toast.error('Failed to save hero data')
            }
          } catch (error) {
            console.error('Error saving hero data:', error)
            toast.error('Error saving hero data')
          }
        }
        
        // 处理英雄数据接收确认消息
        if (data && data.type === 'HERO_DATA_RECEIVED') {
          console.log('Game confirmed receipt of hero data')
        }
      } catch (error) {
        console.error('Error processing game message:', error)
      }
    }
    
    // 添加消息监听器
    window.addEventListener('message', handleGameMessage)
    
    // 清理函数
    return () => {
      window.removeEventListener('message', handleGameMessage)
    }
  }, [hero])

  // 处理区块链保存完成
  const handleBlockchainSaveComplete = (hash: string) => {
    setTxHash(hash)
    
    // 更新英雄数据，添加交易哈希
    if (hero) {
      setHero({
        ...hero,
        txHash: hash
      })
    }
  }

  // 处理 iframe 加载完成
  const handleIframeLoad = () => {
    console.log('Game iframe loaded')
    setGameLoaded(true)
    
    // 延迟一点时间再发送数据，确保桥接页面已完全加载
    setTimeout(() => {
      // 如果已经有英雄数据，发送到游戏
      if (hero) {
        try {
          const iframe = document.getElementById('game-iframe') as HTMLIFrameElement
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
              type: 'HERO_DATA',
              payload: hero
            }, '*')
            console.log('Hero data sent to game after load:', hero)
          }
        } catch (error) {
          console.error('Error sending data to game after load:', error)
        }
      }
    }, 500) // 延迟500毫秒
  }

  return (
    <>
      {!hero ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Your Hero</h2>
          <div className="flex gap-4 mb-4">
            <Input
              type="text"
              placeholder="Enter hero name"
              value={heroName}
              onChange={(e) => setHeroName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={createHero} 
              disabled={isLoading || !heroName.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Hero'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Hero</h2>
          <p className="mb-1"><strong>Name:</strong> {hero.name}</p>
          <p className="mb-1"><strong>Points:</strong> {hero.points}</p>
          <p className="mb-1"><strong>Level:</strong> {hero.level}</p>
          {txHash && (
            <p className="mb-4 text-sm text-green-600">
              <strong>Blockchain TX:</strong> {txHash.substring(0, 10)}...
            </p>
          )}
        </div>
      )}
      
      {hero && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="aspect-video w-full mb-4 relative">
                <iframe
                  id="game-iframe"
                  src="/game/game-bridge.html"
                  className="w-full h-full border-0 rounded"
                  title="Arcadia Game"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={handleIframeLoad}
                ></iframe>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-semibold mb-2">Game Instructions</h3>
                <p>Play the game and earn points. Use the "Save Game" button in the top-right corner to save your progress.</p>
                <p className="text-sm text-gray-500 mt-2">Note: This game uses the Godot engine and may take a moment to load.</p>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <BlockchainConnector 
              heroData={hero} 
              onSaveComplete={handleBlockchainSaveComplete} 
            />
            
            <div className="bg-white rounded-lg shadow-md p-4 mt-6">
              <h3 className="font-semibold mb-2">Game Stats</h3>
              <p className="text-sm mb-1">Points: {hero.points}</p>
              <p className="text-sm mb-1">Level: {hero.level}</p>
              <p className="text-sm mb-1">Created: {new Date(hero.createdAt).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">
                Save your progress regularly to earn rewards!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 