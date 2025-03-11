'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import BlockchainConnector from '@/components/blockchain-connector'
import { Maximize2, Minimize2 } from 'lucide-react'

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
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [gameLoaded, setGameLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const gameContainerRef = useRef<HTMLDivElement>(null)

  // 初始化默认英雄数据
  useEffect(() => {
    // 创建默认英雄
    const defaultHero: Hero = {
      name: user.name || 'Adventurer',
      points: 0,
      level: 1,
      userId: user.email || 'unknown',
      createdAt: new Date().toISOString()
    }
    
    setHero(defaultHero)
    setIsLoading(false)
  }, [user])

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
      
      // 设置英雄数据（仅本地状态）
      setHero(newHero)
      toast.success(`Hero ${heroName} created!`)
    } catch (error) {
      console.error('Error creating hero:', error)
      toast.error('Error creating hero')
    } finally {
      setIsCreating(false)
    }
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
          
          // 更新本地英雄数据（不调用API）
          setHero(data.payload as Hero)
          toast.success('Hero data saved locally!')
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
      const updatedHero = {
        ...hero,
        txHash: hash
      }
      
      setHero(updatedHero)
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

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!gameContainerRef.current) return;
    
    if (!isFullscreen) {
      // 进入全屏模式
      if (gameContainerRef.current.requestFullscreen) {
        gameContainerRef.current.requestFullscreen();
      } else if ((gameContainerRef.current as any).webkitRequestFullscreen) {
        (gameContainerRef.current as any).webkitRequestFullscreen();
      } else if ((gameContainerRef.current as any).msRequestFullscreen) {
        (gameContainerRef.current as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // 退出全屏模式
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <>
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-center items-center h-32">
          <p>Loading hero data...</p>
        </div>
      ) : !hero ? (
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
              disabled={isCreating || !heroName.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Hero'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 mb-4">
          {/* 英雄信息 */}
          <div className="bg-white rounded-lg shadow-md p-4 flex-1 h-32">
            <h2 className="text-lg font-semibold mb-1">Your Hero</h2>
            <p className="text-sm mb-1"><strong>Name:</strong> {hero.name}</p>
            <p className="text-sm mb-1"><strong>Points:</strong> {hero.points}</p>
            <p className="text-sm mb-1"><strong>Level:</strong> {hero.level}</p>
            {txHash && (
              <p className="text-xs text-green-600">
                <strong>TX:</strong> {txHash.substring(0, 10)}...
              </p>
            )}
          </div>
          
          {/* 区块链连接 */}
          <div className="flex-1 h-32">
            <BlockchainConnector 
              heroData={hero} 
              onSaveComplete={handleBlockchainSaveComplete} 
            />
          </div>
          
          {/* 游戏统计 */}
          <div className="bg-white rounded-lg shadow-md p-4 flex-1 h-32">
            <h3 className="text-lg font-semibold mb-1">Game Stats</h3>
            <p className="text-sm mb-1">Points: {hero.points}</p>
            <p className="text-sm mb-1">Level: {hero.level}</p>
            <p className="text-sm mb-1">Created: {new Date(hero.createdAt).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">
              Save progress to earn rewards!
            </p>
          </div>
        </div>
      )}
      
      {hero && (
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-md p-4 relative" ref={gameContainerRef}>
            <div className="absolute top-6 right-6 z-10">
              <Button
                variant="outline"
                size="icon"
                className="bg-white/80 hover:bg-white"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </Button>
            </div>
            <div className="aspect-video w-full relative h-[calc(100vh-250px)]">
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
          </div>
        </div>
      )}
    </>
  )
}