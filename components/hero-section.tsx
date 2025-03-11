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

// ERC721 ABI
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)'
]

// Hero ABI
const HERO_ABI = [
  'function getHeroInfo(address nftContract, uint256 tokenId) view returns (tuple(string name, uint8 race, uint8 gender, uint16 level, uint16 energy, uint16 dailyPoints))'
]

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
      if (!window.ethereum) {
        console.log('MetaMask is not installed');
        setIsLoading(false);
        return;
      }
      
      // 使用 window.ethereum 请求
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();
      
      // 检查合约地址是否有效
      if (!ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS || ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        console.error('Invalid NFT contract address');
        toast.error('Invalid NFT contract address');
        setIsLoading(false);
        return;
      }
      
      // 检查网络是否正确
      try {
        const network = await provider.getNetwork();
        console.log('Current network:', network.name, network.chainId);
      } catch (networkError) {
        console.error('Error checking network:', networkError);
        toast.error('Error checking network');
        setIsLoading(false);
        return;
      }
      
      try {
        // 检查合约是否存在
        try {
          const code = await provider.getCode(ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS);
          if (code === '0x') {
            console.error('Contract does not exist at the specified address');
            toast.error('NFT contract does not exist at the specified address');
            setIsLoading(false);
            return;
          }
        } catch (contractError) {
          console.error('Error checking contract existence:', contractError);
          toast.error('Error checking NFT contract existence');
          setIsLoading(false);
          return;
        }
        
        // 创建合约实例
        const nftContract = new ethers.Contract(
          ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS,
          ERC721_ABI,
          provider
        );
        
        // 创建英雄合约实例 (如果有)
        let heroContract: ethers.Contract | null = null;
        if (ETHEREUM_CONTRACTS.HERO_ADDRESS) {
          try {
            const heroCode = await provider.getCode(ETHEREUM_CONTRACTS.HERO_ADDRESS);
            if (heroCode !== '0x') {
              heroContract = new ethers.Contract(
                ETHEREUM_CONTRACTS.HERO_ADDRESS,
                HERO_ABI,
                signer
              );
              console.log('Hero contract initialized');
            }
          } catch (heroContractError) {
            console.error('Error initializing hero contract:', heroContractError);
          }
        }
        
        // 检查用户是否拥有NFT
        let balance;
        try {
          balance = await nftContract.balanceOf(address);
          console.log('NFT balance:', balance.toString());
        } catch (balanceError) {
          console.error('Error checking NFT balance:', balanceError);
          toast.error('Error checking NFT balance');
          
          // 创建一个默认的英雄
          const defaultHero: Hero = {
            name: `Hero of ${address.substring(0, 6)}`,
            points: 0,
            level: 1,
            userId: user.email || 'unknown',
            createdAt: new Date().toISOString()
          };
          
          setHero(defaultHero);
          setIsLoading(false);
          return;
        }
        
        if (balance && balance.toNumber() > 0) {
          // 获取用户的第一个NFT的tokenId
          let tokenId;
          try {
            // 尝试使用 tokenOfOwnerByIndex 方法
            tokenId = await nftContract.tokenOfOwnerByIndex(address, 0);
            console.log('Token ID:', tokenId.toString());
          } catch (tokenError) {
            console.error('Error getting token ID:', tokenError);
            
            // 尝试获取所有的 NFT 事件来确定 tokenId
            try {
              const transferEvents = await nftContract.queryFilter(
                nftContract.filters.Transfer(null, address, null)
              );
              
              if (transferEvents.length > 0) {
                // 使用最近的转账事件
                const latestEvent = transferEvents[transferEvents.length - 1];
                tokenId = latestEvent.args?.tokenId;
                console.log('Token ID from events:', tokenId.toString());
              } else {
                throw new Error('No transfer events found');
              }
            } catch (eventsError) {
              console.error('Error getting token events:', eventsError);
              
              // 创建一个默认的英雄，因为用户确实拥有NFT，但我们无法获取tokenId
              const defaultHero: Hero = {
                name: `Hero of ${address.substring(0, 6)}`,
                points: 0,
                level: 1,
                userId: user.email || 'unknown',
                createdAt: new Date().toISOString()
              };
              
              setHero(defaultHero);
              setIsLoading(false);
              return;
            }
          }
          
          // 如果有英雄合约，尝试获取英雄信息
          if (heroContract) {
            try {
              const heroInfo = await (heroContract as any).getHeroInfo(ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS, tokenId);
              console.log('Hero info from contract:', heroInfo);
              
              // 创建基于合约数据的英雄
              const contractHero: Hero = {
                name: heroInfo.name || `Hero #${tokenId.toString()}`,
                points: heroInfo.dailyPoints ? parseInt(heroInfo.dailyPoints.toString()) : 0,
                level: heroInfo.level ? parseInt(heroInfo.level.toString()) : 1,
                userId: user.email || 'unknown',
                createdAt: new Date().toISOString(),
                tokenId: tokenId.toString()
              };
              
              setHero(contractHero);
              
              // 保存到API
              try {
                await saveHero(contractHero);
              } catch (saveError) {
                console.error('Error saving hero to API:', saveError);
              }
              
              setIsLoading(false);
              return;
            } catch (heroInfoError) {
              console.log('Hero info not found in contract, falling back to metadata:', heroInfoError);
              // 继续使用元数据方法
            }
          }
          
          // 获取NFT的元数据URI
          let tokenURI;
          try {
            tokenURI = await nftContract.tokenURI(tokenId);
            console.log('Token URI:', tokenURI);
          } catch (uriError) {
            console.error('Error getting token URI:', uriError);
            
            // 创建一个基于tokenId的英雄
            const tokenIdHero: Hero = {
              name: `Hero #${tokenId.toString()}`,
              points: 0,
              level: 1,
              userId: user.email || 'unknown',
              createdAt: new Date().toISOString(),
              tokenId: tokenId.toString()
            };
            
            setHero(tokenIdHero);
            
            // 保存到API
            try {
              await saveHero(tokenIdHero);
            } catch (saveError) {
              console.error('Error saving hero to API:', saveError);
            }
            
            setIsLoading(false);
            return;
          }
          
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
        } else {
          console.log('User has no NFTs');
        }
      } catch (contractError) {
        console.error('Error interacting with contract:', contractError);
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

  // 保存英雄到API
  const saveHero = async (hero: Hero) => {
    try {
      const response = await fetch('/api/heroes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hero),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving hero:', error);
      throw error;
    }
  };

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