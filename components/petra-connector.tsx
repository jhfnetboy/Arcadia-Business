'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useBlockchainWallet } from './blockchain-wallet'
import { APTOS_CONTRACTS } from '@/lib/constants'

interface PetraConnectorProps {
  tokenAddress: string
  tokenSymbol?: string
}

// 特定的代币地址
const SPECIFIC_TOKEN_ADDRESS = '0x53f7e4ab7f52b7030d5a53f343eb37c64d9a36838c5e545542e21dc7b8b4bfd8';

export default function PetraConnector({ 
  tokenAddress, 
  tokenSymbol = 'APT' 
}: PetraConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const { 
    aptosAddress, 
    aptosBalance, 
    updateAptosBalance,
    connectAptos
  } = useBlockchainWallet();

  // 获取Petra钱包
  const getPetraWallet = () => {
    if (typeof window === 'undefined') return undefined;
    
    // 使用Aptos Wallet Standard API
    if (window.aptosWallets) {
      return window.aptosWallets.find(wallet => wallet.name === 'Petra');
    }
    
    return window.aptos;
  };

  // 连接 Petra 钱包
  const connectWallet = async () => {
    if (typeof window === 'undefined') {
      toast.error('Browser environment not available');
      return;
    }

    const petraWallet = getPetraWallet();
    
    if (!petraWallet) {
      toast.error('Petra wallet not installed. Please install Petra wallet first.');
      window.open('https://petra.app/', '_blank');
      return;
    }

    setIsConnecting(true);

    try {
      // 使用区块链钱包上下文中的连接函数
      await connectAptos();
      
      // 连接成功后查询余额
      if (aptosAddress) {
        const balance = await fetchTokenBalance();
        if (balance) {
          updateAptosBalance(balance);
        }
        
        // 查询 NFT 合约
        await checkNFTContract(aptosAddress);
      }
    } catch (error) {
      console.error('Error connecting to Petra wallet:', error);
      toast.error('Failed to connect to Petra wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // 查询 NFT 合约
  const checkNFTContract = async (address: string) => {
    try {
      // 获取环境变量中的 NFT 合约地址
      const nftContractAddress = process.env.NEXT_PUBLIC_MOVE_HERO_NFT_ADDRESS || 
                                process.env.VITE_MOVE_HERO_NFT_ADDRESS || 
                                APTOS_CONTRACTS.MOVE_HERO_NFT_ADDRESS;
      
      if (!nftContractAddress) {
        console.warn('Aptos NFT contract address not found');
        return;
      }
      
      console.log('Checking Aptos NFT contract:', nftContractAddress);
      
      // 尝试使用多个网络端点
      const endpoints = [
        'https://fullnode.testnet.aptoslabs.com/v1',
        'https://fullnode.mainnet.aptoslabs.com/v1',
        'https://fullnode.devnet.aptoslabs.com/v1'
      ];
      
      let nftFound = false;
      
      for (const endpoint of endpoints) {
        try {
          // 查询账户资源
          const resourcesResponse = await fetch(`${endpoint}/accounts/${address}/resources`);
          
          if (!resourcesResponse.ok) continue;
          
          const resources = await resourcesResponse.json();
          
          if (!Array.isArray(resources)) continue;
          
          // 查找 NFT 相关资源
          const nftResources = resources.filter((r: any) => 
            r.type.includes('0x3::token::') || 
            r.type.includes('0x4::collection::') ||
            r.type.includes('::nft::') ||
            r.type.includes(nftContractAddress)
          );
          
          if (nftResources.length > 0) {
            console.log('Found NFT resources:', nftResources);
            toast.success(`Found ${nftResources.length} NFT resources in your wallet!`);
            nftFound = true;
            break;
          }
          
          // 尝试查询 NFT 事件
          try {
            const eventsResponse = await fetch(
              `${endpoint}/accounts/${address}/events/${nftContractAddress}/nft_minted_events`
            );
            
            if (eventsResponse.ok) {
              const events = await eventsResponse.json();
              if (Array.isArray(events) && events.length > 0) {
                console.log('Found NFT events:', events);
                toast.success(`Found ${events.length} NFT events in your wallet!`);
                nftFound = true;
                break;
              }
            }
          } catch (eventError) {
            console.log('Error fetching NFT events:', eventError);
          }
        } catch (endpointError) {
          console.log(`Error with endpoint ${endpoint}:`, endpointError);
        }
      }
      
      if (!nftFound) {
        console.log('No NFTs found for address:', address);
        toast.info('No NFTs found in your wallet');
      }
    } catch (error) {
      console.error('Error checking NFT contract:', error);
    }
  };

  // 断开连接
  const disconnectWallet = async () => {
    if (typeof window === 'undefined') return;

    try {
      // 使用区块链钱包上下文中的断开连接函数
      await useBlockchainWallet().disconnectWallet();
      toast.info('Petra wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting from Petra wallet:', error);
      toast.error('Failed to disconnect from Petra wallet');
    }
  };

  // 查询特定地址的代币余额
  const fetchTokenBalance = async () => {
    try {
      if (!aptosAddress) {
        console.log('No wallet address available');
        return '0';
      }

      // 使用 Aptos SDK 方法获取余额
      // 尝试使用多个网络端点，包括测试网和主网
      const endpoints = [
        // Testnet
        'https://fullnode.testnet.aptoslabs.com/v1',
        // Mainnet
        'https://fullnode.mainnet.aptoslabs.com/v1',
        // Devnet
        'https://fullnode.devnet.aptoslabs.com/v1'
      ];
      
      let balance = '0';
      let success = false;
      
      // 尝试所有端点，直到找到一个有效的
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying Aptos endpoint: ${endpoint} for address: ${aptosAddress}`);
          
          // 方法 1: 使用 SDK 的 getAccountResources 方法
          const response = await fetch(`${endpoint}/accounts/${aptosAddress}/resources`);
          
          if (!response.ok) {
            console.log(`Endpoint ${endpoint} returned status: ${response.status}`);
            continue;
          }
          
          const resources = await response.json();
          
          if (!Array.isArray(resources)) {
            console.log(`Endpoint ${endpoint} returned invalid data format`);
            continue;
          }
          
          // 对于原生APT代币
          if (tokenAddress === '0x1::aptos_coin::AptosCoin') {
            const aptCoinResource = resources.find((r) => 
              r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
            );
            
            if (aptCoinResource?.data?.coin?.value) {
              const balanceInApt = parseFloat(aptCoinResource.data.coin.value) / 10**8;
              balance = balanceInApt.toFixed(4);
              success = true;
              console.log(`Successfully retrieved APT balance from ${endpoint}: ${balance}`);
              break;
            }
          } else {
            // 对于其他代币
            const coinType = `0x1::coin::CoinStore<${tokenAddress}>`;
            const resource = resources.find((r) => r.type === coinType);
            
            if (resource?.data?.coin?.value) {
              const balanceInApt = parseFloat(resource.data.coin.value) / 10**8;
              balance = balanceInApt.toFixed(4);
              success = true;
              console.log(`Successfully retrieved token balance from ${endpoint}: ${balance}`);
              break;
            }
          }
          
          console.log(`No matching resource found in endpoint ${endpoint}`);
        } catch (endpointError) {
          console.log(`Error connecting to endpoint: ${endpoint}`, endpointError);
          // 继续尝试下一个端点
        }
      }
      
      if (!success) {
        console.warn('All Aptos network endpoints failed or no matching resource found');
        return '0';
      }
      
      return balance;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      {!aptosAddress ? (
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? 'Connecting...' : 'Connect Petra Wallet'}
        </Button>
      ) : (
        <>
          <Button 
            variant="outline" 
            className="w-full bg-green-100 hover:bg-green-200 border-green-300 text-green-800"
            onClick={disconnectWallet}
          >
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Connected: {aptosAddress.substring(0, 6)}...{aptosAddress.substring(aptosAddress.length - 4)}
            </span>
          </Button>
          
          {aptosBalance && (
            <div className="text-sm text-center">
              Balance: {aptosBalance} {tokenSymbol}
            </div>
          )}
        </>
      )}
    </div>
  );
} 