'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useBlockchainWallet } from './blockchain-wallet'
import { ETHEREUM_CONTRACTS } from '@/lib/constants'
import { ethers } from 'ethers'
import NFTCard from './nft-card'
import { useRouter } from 'next/navigation'

// ERC721 ABI with Transfer event
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
]

interface NFT {
  tokenId: string
  tokenURI?: string
  metadata?: any
}

// 创建一个全局事件总线，用于组件间通信
export const selectNFTEvent = new CustomEvent('selectNFT', { detail: null });

export default function NFTSection() {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const { ethereumAddress, currentNetwork } = useBlockchainWallet()
  const router = useRouter()

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

  // 处理NFT选择
  const handleSelectNft = (nft: NFT) => {
    setSelectedNft(nft);
    addDebugInfo(`Selected NFT: ${nft.tokenId}`);
    
    // 触发自定义事件，通知其他组件
    try {
      // 创建带有NFT数据的事件
      const event = new CustomEvent('selectNFT', { 
        detail: { nft },
        bubbles: true,
        cancelable: true
      });
      
      // 分发事件
      document.dispatchEvent(event);
      addDebugInfo(`Dispatched selectNFT event for token ID: ${nft.tokenId}`);
      
      // 更新URL以包含选定的NFT
      // router.push(`/town?nft=${nft.tokenId}`);
    } catch (error) {
      console.error('Error dispatching selectNFT event:', error);
      addDebugInfo(`Error dispatching event: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Your NFTs</CardTitle>
        <CardDescription>View and manage your NFT collection</CardDescription>
      </CardHeader>
      <CardContent>
        <NFTCard 
          nfts={nfts}
          onSelectNft={handleSelectNft}
          selectedNftId={selectedNft?.tokenId}
          ethereumAddress={ethereumAddress || ''}
          isLoading={isLoading}
          currentNetwork={currentNetwork || ''}
        />
        
        {/* 调试信息 */}
        {debugInfo.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 max-h-40 overflow-y-auto">
            <p className="font-medium mb-1">Debug Info:</p>
            {debugInfo.map((info, index) => (
              <p key={index} className="mb-1">{info}</p>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-xs text-gray-500">
          {selectedNft ? (
            <p>Selected NFT: #{selectedNft.tokenId}</p>
          ) : (
            <p>Click on an NFT to select it</p>
          )}
        </div>
      </CardFooter>
    </Card>
  )
} 