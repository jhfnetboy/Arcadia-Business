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

// ERC721 ABI with Transfer event
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
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

interface NFT {
  tokenId: string
  tokenURI?: string
  metadata?: any
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
  const [nfts, setNfts] = useState<NFT[]>([])
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null)
  const { ethereumAddress, aptosAddress, currentNetwork } = useBlockchainWallet()

  // 加载用户的 NFT
  useEffect(() => {
    const loadNFTs = async () => {
      if (!ethereumAddress || currentNetwork !== 'ethereum') return;
      
      setIsLoading(true);
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        
        // 检查合约地址是否有效
        if (!ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS) {
          console.error('Invalid NFT contract address');
          toast.error('Invalid NFT contract address');
          return;
        }
        
        // 创建合约实例
        const nftContract = new ethers.Contract(
          ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS,
          ERC721_ABI,
          provider
        );
        
        // 获取用户的 NFT 数量
        const balance = await nftContract.balanceOf(ethereumAddress);
        console.log('NFT balance:', balance.toString());
        
        // 获取所有的 NFT
        const userNfts: NFT[] = [];
        for (let i = 0; i < balance.toNumber(); i++) {
          try {
            const tokenId = await nftContract.tokenOfOwnerByIndex(ethereumAddress, i);
            console.log('Found token ID:', tokenId.toString());
            
            let tokenURI;
            try {
              tokenURI = await nftContract.tokenURI(tokenId);
            } catch (uriError) {
              console.error('Error getting token URI:', uriError);
            }
            
            userNfts.push({
              tokenId: tokenId.toString(),
              tokenURI
            });
          } catch (error) {
            console.error('Error getting token ID:', error);
            continue;
          }
        }
        
        setNfts(userNfts);
      } catch (error) {
        console.error('Error loading NFTs:', error);
        toast.error('Error loading NFTs');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNFTs();
  }, [ethereumAddress, currentNetwork]);

  // 加载选中 NFT 的英雄信息
  useEffect(() => {
    const loadHeroInfo = async () => {
      if (!selectedNft || !ethereumAddress) return;
      
      setIsLoading(true);
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const signer = provider.getSigner();
        
        // 创建英雄合约实例
        if (!ETHEREUM_CONTRACTS.HERO_ADDRESS) {
          console.error('Invalid hero contract address');
          return;
        }
        
        const heroContract = new ethers.Contract(
          ETHEREUM_CONTRACTS.HERO_ADDRESS,
          HERO_ABI,
          signer
        );
        
        try {
          const heroInfo = await heroContract.getHeroInfo(
            ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS,
            selectedNft.tokenId
          );
          
          // 创建英雄对象
          const newHero: Hero = {
            name: heroInfo.name || `Hero #${selectedNft.tokenId}`,
            points: heroInfo.dailyPoints ? parseInt(heroInfo.dailyPoints.toString()) : 0,
            level: heroInfo.level ? parseInt(heroInfo.level.toString()) : 1,
            userId: user.email || 'unknown',
            createdAt: new Date().toISOString(),
            tokenId: selectedNft.tokenId
          };
          
          setHero(newHero);
          
          // 保存到 API
          await saveHero(newHero);
        } catch (error) {
          console.error('Error getting hero info:', error);
          // 如果合约调用失败，创建新的英雄
          const newHero: Hero = {
            name: `Hero #${selectedNft.tokenId}`,
            points: 0,
            level: 1,
            userId: user.email || 'unknown',
            createdAt: new Date().toISOString(),
            tokenId: selectedNft.tokenId
          };
          
          setHero(newHero);
          await saveHero(newHero);
        }
      } catch (error) {
        console.error('Error loading hero info:', error);
        toast.error('Error loading hero info');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHeroInfo();
  }, [selectedNft, ethereumAddress, user.email]);

  // 保存英雄到 API
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Your Heroes</CardTitle>
        <CardDescription>Manage your game heroes</CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <p>Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* NFT 列表 */}
            {nfts.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Your NFTs</h3>
                <div className="grid grid-cols-2 gap-2">
                  {nfts.map((nft) => (
                    <Button
                      key={nft.tokenId}
                      variant={selectedNft?.tokenId === nft.tokenId ? "default" : "outline"}
                      onClick={() => setSelectedNft(nft)}
                      className="w-full"
                    >
                      Token #{nft.tokenId}
                    </Button>
                  ))}
                </div>
              </div>
            ) : currentNetwork === 'ethereum' ? (
              <p className="text-sm text-gray-500">No NFTs found in your wallet</p>
            ) : null}
            
            {/* 英雄信息 */}
            {hero ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Hero Information</h3>
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
            ) : selectedNft ? (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter hero name"
                  value={heroName}
                  onChange={(e) => setHeroName(e.target.value)}
                  className="w-full"
                />
                <Button
                  onClick={() => {
                    const newHero: Hero = {
                      name: heroName || `Hero #${selectedNft.tokenId}`,
                      points: 0,
                      level: 1,
                      userId: user.email || 'unknown',
                      createdAt: new Date().toISOString(),
                      tokenId: selectedNft.tokenId
                    };
                    setHero(newHero);
                    saveHero(newHero);
                  }}
                  disabled={isCreating}
                  className="w-full"
                >
                  Create Hero with Selected NFT
                </Button>
              </div>
            ) : null}
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
        ) : null}
      </CardFooter>
    </Card>
  )
} 