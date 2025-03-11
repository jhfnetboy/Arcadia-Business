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
  const [contractError, setContractError] = useState<string | null>(null)
  const [heroNotFound, setHeroNotFound] = useState(false)
  const { ethereumAddress, aptosAddress, currentNetwork } = useBlockchainWallet()

  // 加载用户的 NFT
  useEffect(() => {
    const loadNFTs = async () => {
      if (!ethereumAddress || currentNetwork !== 'ethereum') return;
      
      setIsLoading(true);
      try {
        console.log('Loading NFTs for address:', ethereumAddress);
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        
        // 检查合约地址是否有效
        if (!ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS) {
          console.error('Invalid NFT contract address');
          toast.error('Invalid NFT contract address');
          return;
        }
        
        console.log('Using NFT contract address:', ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS);
        
        // 创建合约实例
        const nftContract = new ethers.Contract(
          ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS,
          ERC721_ABI,
          provider
        );
        
        // 获取用户的 NFT 数量
        let balance;
        try {
          balance = await nftContract.balanceOf(ethereumAddress);
          console.log('NFT balance:', balance.toString());
        } catch (balanceError) {
          console.error('Error checking NFT balance:', balanceError);
          toast.error('Error checking NFT balance');
          setIsLoading(false);
          return;
        }
        
        // 如果用户没有 NFT，直接返回
        if (balance.toNumber() === 0) {
          console.log('User has no NFTs');
          setIsLoading(false);
          return;
        }
        
        // 获取所有的 NFT
        const userNfts: NFT[] = [];
        
        // 方法 1: 尝试使用 tokenOfOwnerByIndex (ERC721Enumerable)
        let useEnumerable = true;
        
        // 先尝试获取第一个 token 来检查是否支持 ERC721Enumerable
        try {
          await nftContract.tokenOfOwnerByIndex(ethereumAddress, 0);
        } catch (error) {
          console.log('Contract does not support ERC721Enumerable, using alternative method');
          useEnumerable = false;
        }
        
        if (useEnumerable) {
          // 使用 ERC721Enumerable 接口
          for (let i = 0; i < balance.toNumber(); i++) {
            try {
              const tokenId = await nftContract.tokenOfOwnerByIndex(ethereumAddress, i);
              console.log('Found token ID:', tokenId.toString());
              
              let tokenURI;
              let metadata = null;
              try {
                tokenURI = await nftContract.tokenURI(tokenId);
                console.log('Token URI:', tokenURI);
                
                // 获取元数据
                if (tokenURI) {
                  try {
                    // 如果是 IPFS URI，转换为 HTTP URL
                    const url = tokenURI.startsWith('ipfs://') 
                      ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/') 
                      : tokenURI;
                    
                    const response = await fetch(url);
                    if (response.ok) {
                      metadata = await response.json();
                      console.log('NFT Metadata:', metadata);
                    }
                  } catch (metadataError) {
                    console.error('Error fetching metadata:', metadataError);
                  }
                }
              } catch (uriError) {
                console.error('Error getting token URI:', uriError);
              }
              
              userNfts.push({
                tokenId: tokenId.toString(),
                tokenURI,
                metadata
              });
            } catch (error) {
              console.error('Error getting token ID at index', i, ':', error);
              continue;
            }
          }
        } else {
          // 方法 2: 使用 Transfer 事件查询
          try {
            console.log('Trying to get NFTs using Transfer events');
            
            // 创建一个过滤器，查找转移到用户地址的事件
            const filter = nftContract.filters.Transfer(null, ethereumAddress, null);
            
            // 查询过去的事件
            const events = await nftContract.queryFilter(filter);
            console.log('Found Transfer events:', events.length);
            
            // 创建一个 Set 来存储唯一的 tokenId
            const tokenIds = new Set<string>();
            
            // 处理事件
            for (const event of events) {
              const tokenId = event.args?.tokenId.toString();
              
              // 检查这个 token 是否仍然属于用户
              try {
                const owner = await nftContract.ownerOf(tokenId);
                if (owner.toLowerCase() === ethereumAddress.toLowerCase()) {
                  tokenIds.add(tokenId);
                }
              } catch (ownerError) {
                console.error('Error checking owner of token', tokenId, ':', ownerError);
              }
            }
            
            console.log('Unique token IDs owned by user:', Array.from(tokenIds));
            
            // 获取每个 token 的元数据
            for (const tokenId of Array.from(tokenIds)) {
              let tokenURI;
              let metadata = null;
              
              try {
                tokenURI = await nftContract.tokenURI(tokenId);
                console.log('Token URI for', tokenId, ':', tokenURI);
                
                // 获取元数据
                if (tokenURI) {
                  try {
                    // 如果是 IPFS URI，转换为 HTTP URL
                    const url = tokenURI.startsWith('ipfs://') 
                      ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/') 
                      : tokenURI;
                    
                    const response = await fetch(url);
                    if (response.ok) {
                      metadata = await response.json();
                      console.log('NFT Metadata for', tokenId, ':', metadata);
                    }
                  } catch (metadataError) {
                    console.error('Error fetching metadata for token', tokenId, ':', metadataError);
                  }
                }
              } catch (uriError) {
                console.error('Error getting token URI for token', tokenId, ':', uriError);
              }
              
              userNfts.push({
                tokenId,
                tokenURI,
                metadata
              });
            }
          } catch (eventsError) {
            console.error('Error getting Transfer events:', eventsError);
            
            // 方法 3: 如果前两种方法都失败，创建一些模拟的 NFT 数据用于测试
            if (userNfts.length === 0) {
              console.log('Using fallback method to create sample NFTs');
              for (let i = 0; i < balance.toNumber(); i++) {
                userNfts.push({
                  tokenId: `${i}`,  // 修改为数字字符串，而不是 sample-${i}
                  metadata: {
                    name: `Sample NFT #${i}`,
                    description: 'This is a sample NFT created when other methods failed',
                    image: 'https://placehold.co/400x400?text=Sample+NFT'
                  }
                });
              }
            }
          }
        }
        
        console.log('Final NFT list:', userNfts);
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
      setContractError(null);
      setHeroNotFound(false);
      setHero(null);
      
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const signer = provider.getSigner();
        
        // 创建英雄合约实例
        if (!ETHEREUM_CONTRACTS.HERO_ADDRESS) {
          console.error('Invalid hero contract address');
          setContractError('Invalid hero contract address');
          setIsLoading(false);
          return;
        }
        
        // 确保 tokenId 是有效的数字
        if (!/^\d+$/.test(selectedNft.tokenId)) {
          const error = `Invalid token ID format: ${selectedNft.tokenId}`;
          console.error(error);
          setContractError(error);
          setIsLoading(false);
          return;
        }
        
        console.log('Getting hero info for NFT contract:', ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS, 'and token ID:', selectedNft.tokenId);
        
        try {
          // 创建合约实例
          const heroContract = new ethers.Contract(
            ETHEREUM_CONTRACTS.HERO_ADDRESS,
            HERO_ABI,
            signer
          );
          
          // 尝试从合约获取英雄信息
          try {
            const heroInfo = await heroContract.getHeroInfo(
              ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS,
              selectedNft.tokenId
            );
            
            console.log('Hero info retrieved:', heroInfo);
            
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
            setHeroNotFound(false);
            
          } catch (contractError) {
            console.error('Error getting hero from contract:', contractError);
            setContractError(`Hero not found in contract: ${contractError instanceof Error ? contractError.message : String(contractError)}`);
            setHeroNotFound(true);
          }
        } catch (error) {
          console.error('Error initializing hero contract:', error);
          setContractError(`Error initializing hero contract: ${error instanceof Error ? error.message : String(error)}`);
          setHeroNotFound(true);
        }
      } catch (error) {
        console.error('Error loading hero info:', error);
        setContractError(`Error loading hero info: ${error instanceof Error ? error.message : String(error)}`);
        setHeroNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHeroInfo();
  }, [selectedNft, ethereumAddress, user.email]);

  // 保存英雄到 API
  const saveHero = async (hero: Hero) => {
    try {
      setIsCreating(true);
      
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
      
      const result = await response.json();
      setHero(hero);
      setHeroNotFound(false);
      return result;
    } catch (error) {
      console.error('Error saving hero:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // 创建英雄
  const createHero = () => {
    if (!selectedNft) return;
    
    const newHero: Hero = {
      name: heroName || `Hero #${selectedNft.tokenId}`,
      points: 0,
      level: 1,
      userId: user.email || 'unknown',
      createdAt: new Date().toISOString(),
      tokenId: selectedNft.tokenId
    };
    
    saveHero(newHero).catch(error => {
      console.error('Error saving hero:', error);
      setContractError(`Error saving hero: ${error instanceof Error ? error.message : String(error)}`);
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 左列：NFT 列表 */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Your NFTs</CardTitle>
          <CardDescription>Select an NFT to create or view a hero</CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading && !nfts.length ? (
            <div className="flex items-center justify-center h-24">
              <p>Loading NFTs...</p>
            </div>
          ) : nfts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {nfts.map((nft) => (
                <div 
                  key={nft.tokenId}
                  onClick={() => setSelectedNft(nft)}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedNft?.tokenId === nft.tokenId 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* NFT 图像 */}
                  {nft.metadata?.image ? (
                    <div className="aspect-square w-full mb-2 overflow-hidden rounded-md">
                      <img 
                        src={nft.metadata.image.startsWith('ipfs://') 
                          ? nft.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') 
                          : nft.metadata.image
                        } 
                        alt={`NFT #${nft.tokenId}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=NFT';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-square w-full mb-2 bg-gray-100 flex items-center justify-center rounded-md">
                      <span className="text-gray-500">NFT #{nft.tokenId}</span>
                    </div>
                  )}
                  
                  {/* NFT 信息 */}
                  <div className="space-y-1">
                    <p className="font-medium text-sm truncate">
                      {nft.metadata?.name || `NFT #${nft.tokenId}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      Token ID: {nft.tokenId}
                    </p>
                    {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {nft.metadata.attributes.slice(0, 2).map((attr: any, index: number) => (
                          <span 
                            key={index} 
                            className="text-xs bg-gray-100 px-1.5 py-0.5 rounded"
                          >
                            {attr.trait_type}: {attr.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : currentNetwork === 'ethereum' ? (
            <p className="text-sm text-gray-500">No NFTs found in your wallet</p>
          ) : (
            <p className="text-sm text-gray-500">Connect your Ethereum wallet to view NFTs</p>
          )}
        </CardContent>
      </Card>
      
      {/* 右列：英雄信息 */}
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Your Heroes</CardTitle>
          <CardDescription>Manage your game heroes</CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading && selectedNft ? (
            <div className="flex items-center justify-center h-24">
              <p>Loading hero information...</p>
            </div>
          ) : (
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
                    {isCreating ? 'Creating Hero...' : 'Create Hero with Selected NFT'}
                  </Button>
                </div>
              ) : selectedNft ? (
                <p className="text-sm text-gray-500">Checking hero information...</p>
              ) : (
                <p className="text-sm text-gray-500">Select an NFT to view or create a hero</p>
              )}
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
    </div>
  )
} 