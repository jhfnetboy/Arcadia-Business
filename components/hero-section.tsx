'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useBlockchainWallet } from './blockchain-wallet'
import { ETHEREUM_CONTRACTS } from '@/lib/constants'
import { ethers } from 'ethers'

// 简化版的 ERC721 ABI，只包含我们需要的函数
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)'
];

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
  tokenId?: string
  txHash?: string
}

interface HeroSectionProps {
  user: User
}

export default function HeroSection({ user }: HeroSectionProps) {
  const router = useRouter()
  const [heroName, setHeroName] = useState('')
  const [hero, setHero] = useState<Hero | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { ethereumAddress, aptosAddress } = useBlockchainWallet();

  // 加载英雄数据
  useEffect(() => {
    const fetchHero = async () => {
      setIsLoading(true)
      try {
        // 首先尝试从API加载
        const response = await fetch('/api/hero/get')
        const data = await response.json()
        
        if (data.success && data.hero) {
          setHero(data.hero)
          setIsLoading(false)
          return
        }
        
        // 如果API没有数据，尝试从区块链加载
        if (ethereumAddress && window.ethereum) {
          await loadHeroFromBlockchain(ethereumAddress)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error fetching hero:', error)
        setIsLoading(false)
      }
    }

    fetchHero()
  }, [ethereumAddress])

  // 从区块链加载英雄数据
  const loadHeroFromBlockchain = async (address: string) => {
    try {
      if (!window.ethereum) return;
      
      // 使用 window.ethereum 请求
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const nftContract = new ethers.Contract(
        ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS,
        ERC721_ABI,
        provider
      );
      
      // 检查用户是否拥有NFT
      const balance = await nftContract.balanceOf(address);
      
      if (balance.toNumber() > 0) {
        // 获取用户的第一个NFT的tokenId
        const tokenId = await nftContract.tokenOfOwnerByIndex(address, 0);
        
        // 获取NFT的元数据URI
        const tokenURI = await nftContract.tokenURI(tokenId);
        
        // 获取元数据
        let metadata = {};
        try {
          // 如果tokenURI是IPFS链接，需要转换为HTTP链接
          const url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
          const metadataResponse = await fetch(url);
          metadata = await metadataResponse.json();
        } catch (error) {
          console.error('Error fetching metadata:', error);
          metadata = { name: `Hero #${tokenId.toString()}`, attributes: [] };
        }
        
        // 创建英雄对象
        const blockchainHero: Hero = {
          name: (metadata as any).name || `Hero #${tokenId.toString()}`,
          points: 0,
          level: 1,
          userId: user.email || 'unknown',
          createdAt: new Date().toISOString(),
          tokenId: tokenId.toString()
        };
        
        setHero(blockchainHero);
        
        // 保存到API
        try {
          await fetch('/api/hero/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(blockchainHero),
          });
        } catch (error) {
          console.error('Error saving hero to API:', error);
        }
      }
    } catch (error) {
      console.error('Error loading hero from blockchain:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 创建英雄
  const createHero = () => {
    if (!heroName.trim()) {
      toast.error('Please enter a hero name')
      return
    }

    setIsCreating(true)
    
    try {
      // 创建英雄数据（仅在本地状态中）
      const newHero: Hero = {
        name: heroName,
        points: 0,
        level: 1,
        userId: user.email || 'unknown',
        createdAt: new Date().toISOString()
      }
      
      // 设置本地状态
      setHero(newHero)
      toast.success(`Hero ${heroName} created!`)
      
      // 保存到API
      fetch('/api/hero/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newHero),
      }).catch(error => {
        console.error('Error saving hero to API:', error)
      })
      
      // 直接导航到游戏页面
      setTimeout(() => {
        router.push('/town/play')
      }, 500)
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
            {hero.tokenId && (
              <p className="text-xs text-green-600">
                <strong>Token ID:</strong> {hero.tokenId}
              </p>
            )}
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