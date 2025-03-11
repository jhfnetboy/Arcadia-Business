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
import { heroAbi } from '@/public/ABI/hero.js'
import NFTCard from './nft-card'
import { useHero } from '@/lib/hero-context'

// ERC721 ABI with Transfer event
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
]

// 使用导入的 heroAbi 替换硬编码的 HERO_ABI
const HERO_ABI = heroAbi;

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
  network: string
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
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const { ethereumAddress, aptosAddress, currentNetwork } = useBlockchainWallet()
  const { setHero: setGlobalHero } = useHero()

  // 添加调试信息
  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
    
    // 同时添加到全局调试区域
    const debugContainer = document.getElementById('debug-container');
    if (debugContainer) {
      const debugElement = document.createElement('p');
      debugElement.className = 'mb-1';
      debugElement.textContent = `${new Date().toLocaleTimeString()}: ${info}`;
      debugContainer.appendChild(debugElement);
      debugContainer.scrollTop = debugContainer.scrollHeight;
    }
  };

  // 监听钱包连接事件
  useEffect(() => {
    const handleWalletEvent = (event: any) => {
      if (event.detail && event.detail.type === 'connect') {
        const { address, network } = event.detail;
        addDebugInfo(`Received wallet event: ${network} wallet connected with address ${address}`);
        
        // 如果是以太坊钱包连接，重置状态
        if (network === 'ethereum') {
          setHero(null);
          setContractError(null);
          setHeroNotFound(false);
          setSelectedNft(null);
        }
      }
    };
    
    // 添加事件监听器
    document.addEventListener('walletEvent', handleWalletEvent);
    
    // 清理函数
    return () => {
      document.removeEventListener('walletEvent', handleWalletEvent);
    };
  }, []);

  // 监听NFT选择事件
  useEffect(() => {
    const handleNftSelect = (event: any) => {
      if (event.detail && event.detail.nft) {
        const nft = event.detail.nft;
        addDebugInfo(`Received selectNFT event for token ID: ${nft.tokenId}`);
        setSelectedNft(nft);
        
        // 重置状态
        setHero(null);
        setContractError(null);
        setHeroNotFound(false);
      }
    };
    
    // 添加事件监听器
    document.addEventListener('selectNFT', handleNftSelect);
    
    // 清理函数
    return () => {
      document.removeEventListener('selectNFT', handleNftSelect);
    };
  }, []);

  // 加载用户的 NFT
  useEffect(() => {
    const loadNFTs = async () => {
      if (!ethereumAddress || currentNetwork !== 'ethereum') return;
      
      setIsLoading(true);
      addDebugInfo(`Loading NFTs for wallet address: ${ethereumAddress}`);
      
      try {
        // 初始化 provider 和 signer
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const signer = provider.getSigner();
        const network = await provider.getNetwork();
        
        addDebugInfo(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
        
        // 检查合约地址是否有效
        if (!ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS) {
          const error = 'Invalid NFT contract address';
          console.error(error);
          addDebugInfo(error);
          setIsLoading(false);
          return;
        }
        
        // 创建 NFT 合约实例
        const nftContract = new ethers.Contract(
          ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS,
          ERC721_ABI,
          signer
        );
        
        addDebugInfo(`NFT contract initialized at address: ${ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS}`);
        
        try {
          // 获取用户拥有的 NFT 数量
          const balance = await nftContract.balanceOf(ethereumAddress);
          const balanceNumber = balance.toNumber();
          
          addDebugInfo(`User has ${balanceNumber} NFTs`);
          
          if (balanceNumber === 0) {
            setNfts([]);
            setIsLoading(false);
            return;
          }
          
          // 获取用户拥有的所有 NFT
          const tokenIds = new Set<string>();
          const nftPromises: Promise<NFT | null>[] = [];
          
          // 使用替代方法获取 NFT
          // 方法 1: 尝试使用 tokenOfOwnerByIndex (ERC721Enumerable)
          let useEnumerable = true;
          
          // 先尝试获取第一个 token 来检查是否支持 ERC721Enumerable
          try {
            await nftContract.tokenOfOwnerByIndex(ethereumAddress, 0);
          } catch (error) {
            addDebugInfo('Contract does not support ERC721Enumerable, using alternative method');
            useEnumerable = false;
          }
          
          if (useEnumerable) {
            // 使用 ERC721Enumerable 接口
            for (let i = 0; i < balanceNumber; i++) {
              nftPromises.push(
                (async () => {
                  try {
                    const tokenId = await nftContract.tokenOfOwnerByIndex(ethereumAddress, i);
                    const tokenIdStr = tokenId.toString();
                    
                    if (!tokenIds.has(tokenIdStr)) {
                      tokenIds.add(tokenIdStr);
                      
                      // 获取 NFT 的元数据 URI
                      const tokenURI = await nftContract.tokenURI(tokenId);
                      addDebugInfo(`Token #${tokenIdStr} URI: ${tokenURI}`);
                      
                      // 获取元数据
                      let metadata = null;
                      try {
                        const metadataUrl = tokenURI.startsWith('ipfs://')
                          ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
                          : tokenURI;
                        
                        const metadataResponse = await fetch(metadataUrl);
                        if (metadataResponse.ok) {
                          metadata = await metadataResponse.json();
                          addDebugInfo(`Token #${tokenIdStr} metadata loaded successfully`);
                        } else {
                          addDebugInfo(`Failed to load metadata for token #${tokenIdStr}: ${metadataResponse.status}`);
                        }
                      } catch (metadataError) {
                        console.error('Error fetching metadata:', metadataError);
                        addDebugInfo(`Error fetching metadata for token #${tokenIdStr}: ${metadataError instanceof Error ? metadataError.message : String(metadataError)}`);
                      }
                      
                      return {
                        tokenId: tokenIdStr,
                        tokenURI,
                        metadata
                      } as NFT;
                    }
                    return null;
                  } catch (error) {
                    console.error(`Error fetching token at index ${i}:`, error);
                    addDebugInfo(`Error fetching token at index ${i}: ${error instanceof Error ? error.message : String(error)}`);
                    return null;
                  }
                })()
              );
            }
          } else {
            // 方法 2: 使用 Transfer 事件查询
            try {
              addDebugInfo('Trying to get NFTs using Transfer events');
              
              // 创建一个过滤器，查找转移到用户地址的事件
              const filter = nftContract.filters.Transfer(null, ethereumAddress, null);
              
              // 查询过去的事件
              const events = await nftContract.queryFilter(filter);
              addDebugInfo(`Found ${events.length} Transfer events`);
              
              // 处理事件
              for (const event of events) {
                const tokenId = event.args?.tokenId.toString();
                
                // 检查这个 token 是否仍然属于用户
                try {
                  const owner = await nftContract.ownerOf(tokenId);
                  if (owner.toLowerCase() === ethereumAddress.toLowerCase() && !tokenIds.has(tokenId)) {
                    tokenIds.add(tokenId);
                    
                    nftPromises.push(
                      (async () => {
                        try {
                          // 获取 NFT 的元数据 URI
                          const tokenURI = await nftContract.tokenURI(tokenId);
                          addDebugInfo(`Token #${tokenId} URI: ${tokenURI}`);
                          
                          // 获取元数据
                          let metadata = null;
                          try {
                            const metadataUrl = tokenURI.startsWith('ipfs://')
                              ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
                              : tokenURI;
                            
                            const metadataResponse = await fetch(metadataUrl);
                            if (metadataResponse.ok) {
                              metadata = await metadataResponse.json();
                              addDebugInfo(`Token #${tokenId} metadata loaded successfully`);
                            } else {
                              addDebugInfo(`Failed to load metadata for token #${tokenId}: ${metadataResponse.status}`);
                            }
                          } catch (metadataError) {
                            console.error('Error fetching metadata:', metadataError);
                            addDebugInfo(`Error fetching metadata for token #${tokenId}: ${metadataError instanceof Error ? metadataError.message : String(metadataError)}`);
                          }
                          
                          return {
                            tokenId,
                            tokenURI,
                            metadata
                          } as NFT;
                        } catch (error) {
                          console.error(`Error fetching token ${tokenId}:`, error);
                          addDebugInfo(`Error fetching token ${tokenId}: ${error instanceof Error ? error.message : String(error)}`);
                          return null;
                        }
                      })()
                    );
                  }
                } catch (ownerError) {
                  console.error('Error checking owner of token', tokenId, ':', ownerError);
                  addDebugInfo(`Error checking owner of token ${tokenId}: ${ownerError instanceof Error ? ownerError.message : String(ownerError)}`);
                }
              }
            } catch (eventsError) {
              console.error('Error getting Transfer events:', eventsError);
              addDebugInfo(`Error getting Transfer events: ${JSON.stringify(eventsError) || 'Unknown error'}`);
              
              // 方法 3: 如果前两种方法都失败，创建一些模拟的 NFT 数据用于测试
              if (tokenIds.size === 0) {
                addDebugInfo('Using fallback method to create sample NFTs');
                for (let i = 0; i < Math.min(balanceNumber || 3, 5); i++) {
                  const tokenId = `${i}`;
                  nftPromises.push(Promise.resolve({
                    tokenId,
                    metadata: {
                      name: `Sample NFT #${i}`,
                      description: 'This is a sample NFT created when other methods failed',
                      image: 'https://placehold.co/400x400?text=Sample+NFT'
                    }
                  } as NFT));
                }
              }
            }
          }
          
          const results = await Promise.all(nftPromises);
          const validNfts = results.filter(Boolean) as NFT[];
          
          addDebugInfo(`Successfully loaded ${validNfts.length} NFTs`);
          setNfts(validNfts);
          
        } catch (error) {
          console.error('Error loading NFTs:', error);
          addDebugInfo(`Error loading NFTs: ${error instanceof Error ? error.message : String(error)}`);
          
          // 如果加载失败，创建一些模拟的 NFT 数据用于测试
          const sampleNfts: NFT[] = [];
          for (let i = 0; i < 5; i++) {
            sampleNfts.push({
              tokenId: `${i}`,
              metadata: {
                name: `Sample NFT #${i}`,
                description: 'This is a sample NFT created when loading failed',
                image: 'https://placehold.co/400x400?text=Sample+NFT'
              }
            });
          }
          
          addDebugInfo('Created sample NFTs for testing');
          setNfts(sampleNfts);
        }
      } catch (error) {
        console.error('Error initializing NFT contract:', error);
        addDebugInfo(`Error initializing NFT contract: ${error instanceof Error ? error.message : String(error)}`);
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
        addDebugInfo(`Getting hero info for NFT contract: ${ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS} and token ID: ${selectedNft.tokenId}`);
        
        // 检查合约地址是否有效
        if (!ETHEREUM_CONTRACTS.HERO_ADDRESS) {
          const error = 'Invalid hero contract address';
          console.error(error);
          setContractError(error);
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
        
        // 初始化 provider 和 signer
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const signer = provider.getSigner();
        const network = await provider.getNetwork();
        
        addDebugInfo(`Connected to network for hero contract: ${network.name} (chainId: ${network.chainId})`);
        
        try {
          // 检查合约是否存在
          const code = await provider.getCode(ETHEREUM_CONTRACTS.HERO_ADDRESS);
          if (code === '0x') {
            const error = `Hero contract does not exist at address: ${ETHEREUM_CONTRACTS.HERO_ADDRESS}`;
            console.error(error);
            addDebugInfo(error);
            setContractError(error);
            setHeroNotFound(true);
            setIsLoading(false);
            return;
          }
          
          addDebugInfo(`Hero contract exists at address: ${ETHEREUM_CONTRACTS.HERO_ADDRESS}`);
          
          // 创建合约实例
          const heroContract = new ethers.Contract(
            ETHEREUM_CONTRACTS.HERO_ADDRESS,
            HERO_ABI,
            signer
          );
          
          addDebugInfo('Hero contract initialized');
          
          // 尝试从合约获取英雄信息
          try {
            addDebugInfo(`Calling getHeroInfo with params: ${ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS}, ${selectedNft.tokenId}`);
            
            // 检查 ABI 中是否有 getHeroInfo 方法
            const hasGetHeroInfo = HERO_ABI.some((item: any) => 
              item.type === 'function' && item.name === 'getHeroInfo'
            );
            
            if (!hasGetHeroInfo) {
              addDebugInfo('getHeroInfo method not found in contract ABI, trying alternative method');
              setHeroNotFound(true);
              setContractError('getHeroInfo method not found in contract ABI');
            } else {
              // 使用 getHeroInfo 方法
              try {
                // 添加更多日志
                addDebugInfo(`Calling getHeroInfo with NFT contract: ${ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS}`);
                addDebugInfo(`Token ID: ${selectedNft.tokenId} (type: ${typeof selectedNft.tokenId})`);
                
                // 确保tokenId是数字
                const tokenIdNumber = parseInt(selectedNft.tokenId, 10);
                addDebugInfo(`Parsed token ID: ${tokenIdNumber}`);
                
                // 调用合约方法
                const heroInfo = await heroContract.getHeroInfo(
                  ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS,
                  tokenIdNumber
                );
                
                addDebugInfo(`Hero info retrieved: ${JSON.stringify(heroInfo)}`);
                
                // 创建英雄对象
                const newHero: Hero = {
                  name: heroInfo.name || `Hero #${selectedNft.tokenId}`,
                  points: heroInfo.dailyPoints ? parseInt(heroInfo.dailyPoints.toString()) : 0,
                  level: heroInfo.level ? parseInt(heroInfo.level.toString()) : 1,
                  userId: user.email || 'unknown',
                  createdAt: new Date().toISOString(),
                  tokenId: selectedNft.tokenId,
                  network: 'ethereum'
                };
                
                setHero(newHero);
                setGlobalHero(newHero);
                setHeroNotFound(false);
              } catch (contractError) {
                console.error('Error getting hero from contract:', contractError);
                addDebugInfo(`Error getting hero from contract: ${contractError instanceof Error ? contractError.message : JSON.stringify(contractError)}`);
                
                // 检查错误是否表示英雄不存在
                const errorMessage = contractError instanceof Error ? contractError.message : String(contractError);
                if (errorMessage.includes('revert') || errorMessage.includes('not found') || errorMessage.includes('not exist')) {
                  addDebugInfo('Hero not found in contract, allowing creation');
                  setHeroNotFound(true);
                  setContractError(`Hero not found for NFT #${selectedNft.tokenId}`);
                } else {
                  setContractError(`Error calling getHeroInfo: ${errorMessage}`);
                  setHeroNotFound(true);
                }
              }
            }
          } catch (error) {
            console.error('Error calling getHeroInfo:', error);
            addDebugInfo(`Error calling getHeroInfo: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
            setContractError(`Error calling getHeroInfo: ${error instanceof Error ? error.message : String(error)}`);
            setHeroNotFound(true);
          }
        } catch (error) {
          console.error('Error initializing hero contract:', error);
          addDebugInfo(`Error initializing hero contract: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
          setContractError(`Error initializing hero contract: ${error instanceof Error ? error.message : String(error)}`);
          setHeroNotFound(true);
        }
      } catch (error) {
        console.error('Error loading hero info:', error);
        addDebugInfo(`Error loading hero info: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        setContractError(`Error loading hero info: ${error instanceof Error ? error.message : String(error)}`);
        setHeroNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (selectedNft && ethereumAddress) {
      addDebugInfo(`Triggering loadHeroInfo for token ID: ${selectedNft.tokenId}`);
      loadHeroInfo();
    }
  }, [selectedNft, ethereumAddress, ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS, ETHEREUM_CONTRACTS.HERO_ADDRESS]);

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
        const error = `API error: ${response.status}`
        addDebugInfo(error)
        throw new Error(error)
      }
      
      const result = await response.json()
      addDebugInfo(`Hero saved successfully: ${JSON.stringify(result)}`)
      
      // 添加网络信息
      const heroWithNetwork = {
        ...hero,
        network: 'ethereum'
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
    if (!selectedNft) return;
    
    const newHero: Hero = {
      name: heroName || `Hero #${selectedNft.tokenId}`,
      points: 0,
      level: 1,
      userId: user.email || 'unknown',
      createdAt: new Date().toISOString(),
      tokenId: selectedNft.tokenId,
      network: 'ethereum'
    };
    
    addDebugInfo(`Creating hero: ${JSON.stringify(newHero)}`);
    saveHero(newHero).catch(error => {
      console.error('Error saving hero:', error);
      setContractError(`Error saving hero: ${error instanceof Error ? error.message : String(error)}`);
    });
  };

  return (
    <div className="space-y-6">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Your Heroes</CardTitle>
          <CardDescription>Manage your game heroes</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* 英雄信息 */}
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
          </div>
        </CardContent>
        
        <CardFooter>
          {hero ? (
            <Link 
              href="/town/play"
              className="w-full"
              onClick={() => setGlobalHero({...hero, network: 'ethereum'})}
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