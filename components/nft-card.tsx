'use client'

import React from 'react'

interface NFT {
  tokenId: string
  tokenURI?: string
  metadata?: any
}

interface NFTCardProps {
  nfts: NFT[]
  onSelectNft: (nft: NFT) => void
  selectedNftId?: string
  ethereumAddress?: string
  isLoading: boolean
  currentNetwork?: string
}

const NFTCard: React.FC<NFTCardProps> = ({ 
  nfts, 
  onSelectNft, 
  selectedNftId, 
  ethereumAddress, 
  isLoading, 
  currentNetwork 
}) => {
  const handleClick = (nft: NFT) => {
    console.log('NFT card clicked:', nft.tokenId);
    onSelectNft(nft);
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Your NFTs</h3>
      {ethereumAddress ? (
        <div className="text-xs text-gray-500 mb-2">
          Wallet: {ethereumAddress.slice(0, 6)}...{ethereumAddress.slice(-4)}
        </div>
      ) : (
        <div className="text-xs text-gray-500 mb-2">
          Wallet not connected
        </div>
      )}
      
      {isLoading && !nfts.length ? (
        <div className="flex items-center justify-center h-24">
          <p>Loading NFTs...</p>
        </div>
      ) : nfts.length > 0 ? (
        <div className="space-y-3">
          <div className="text-xs text-gray-500">
            Found {nfts.length} NFTs in your wallet
          </div>
          <div className="grid grid-cols-2 gap-3">
            {nfts.map((nft) => (
              <div 
                key={nft.tokenId}
                onClick={() => handleClick(nft)}
                className={`border rounded-lg p-2 cursor-pointer transition-all ${
                  selectedNftId === nft.tokenId 
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
                    <span className="text-gray-500 text-xs">NFT #{nft.tokenId}</span>
                  </div>
                )}
                
                {/* NFT 信息 */}
                <div className="space-y-1">
                  <p className="font-medium text-xs truncate">
                    {nft.metadata?.name || `NFT #${nft.tokenId}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {nft.tokenId}
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
        </div>
      ) : currentNetwork === 'ethereum' ? (
        <p className="text-sm text-gray-500">No NFTs found in your wallet</p>
      ) : (
        <p className="text-sm text-gray-500">Connect your Ethereum wallet to view NFTs</p>
      )}
    </div>
  )
}

export default NFTCard 