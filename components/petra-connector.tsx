'use client'

import { useState, useEffect } from 'react'
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
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const { 
    aptosAddress, 
    aptosBalance, 
    updateAptosBalance,
    connectAptos
  } = useBlockchainWallet();

  // 添加调试信息
  const addDebugInfo = (info: string) => {
    console.log('[Petra Debug]', info);
    setDebugInfo(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]}: ${info}`]);
  };

  // 获取Petra钱包
  const getPetraWallet = () => {
    if (typeof window === 'undefined') {
      addDebugInfo('Browser environment not available');
      return undefined;
    }
    
    // 检查 window.aptos
    if (window.aptos) {
      addDebugInfo('Found window.aptos');
      return window.aptos;
    }
    
    // 使用Aptos Wallet Standard API
    if (window.aptosWallets) {
      addDebugInfo('Found window.aptosWallets');
      const petra = window.aptosWallets.find(wallet => wallet.name === 'Petra');
      if (petra) {
        addDebugInfo('Found Petra wallet in aptosWallets');
        return petra;
      }
    }
    
    addDebugInfo('No Petra wallet found');
    return undefined;
  };

  // 连接 Petra 钱包
  const connectWallet = async () => {
    if (typeof window === 'undefined') {
      toast.error('Browser environment not available');
      return;
    }

    addDebugInfo('Attempting to connect to Petra wallet');
    const petraWallet = getPetraWallet();
    
    if (!petraWallet) {
      addDebugInfo('Petra wallet not installed');
      toast.error('Petra wallet not installed. Please install Petra wallet first.');
      window.open('https://petra.app/', '_blank');
      return;
    }

    setIsConnecting(true);

    try {
      // 使用区块链钱包上下文中的连接函数
      addDebugInfo('Calling connectAptos()');
      await connectAptos();
      
      // 连接成功后查询余额
      if (aptosAddress) {
        addDebugInfo(`Connected to address: ${aptosAddress}`);
        
        // 查询余额
        addDebugInfo('Fetching token balance');
        const balance = await fetchTokenBalance();
        if (balance) {
          addDebugInfo(`Token balance: ${balance} ${tokenSymbol}`);
          updateAptosBalance(balance);
        }
        
        // 查询 NFT 合约
        addDebugInfo('Checking NFT contract');
        await checkNFTContract(aptosAddress);
      } else {
        addDebugInfo('No Aptos address after connection');
      }
    } catch (error) {
      console.error('Error connecting to Petra wallet:', error);
      addDebugInfo(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
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
      
      addDebugInfo(`NFT contract address: ${nftContractAddress || 'Not found'}`);
      
      if (!nftContractAddress) {
        console.warn('Aptos NFT contract address not found');
        return;
      }
      
      // 尝试使用多个网络端点
      const endpoints = [
        'https://fullnode.testnet.aptoslabs.com/v1',
        'https://fullnode.mainnet.aptoslabs.com/v1',
        'https://fullnode.devnet.aptoslabs.com/v1'
      ];
      
      let nftFound = false;
      
      for (const endpoint of endpoints) {
        addDebugInfo(`Trying endpoint: ${endpoint}`);
        try {
          // 查询账户资源
          addDebugInfo(`Fetching resources for ${address}`);
          const resourcesUrl = `${endpoint}/accounts/${address}/resources`;
          addDebugInfo(`Resource URL: ${resourcesUrl}`);
          
          const resourcesResponse = await fetch(resourcesUrl);
          
          if (!resourcesResponse.ok) {
            addDebugInfo(`Endpoint ${endpoint} returned status: ${resourcesResponse.status}`);
            continue;
          }
          
          const resources = await resourcesResponse.json();
          
          if (!Array.isArray(resources)) {
            addDebugInfo(`Endpoint ${endpoint} returned invalid data format`);
            continue;
          }
          
          addDebugInfo(`Found ${resources.length} resources`);
          
          // 查找 NFT 相关资源
          const nftResources = resources.filter((r: any) => 
            r.type.includes('0x3::token::') || 
            r.type.includes('0x4::collection::') ||
            r.type.includes('::nft::') ||
            r.type.includes(nftContractAddress)
          );
          
          if (nftResources.length > 0) {
            addDebugInfo(`Found ${nftResources.length} NFT resources`);
            console.log('Found NFT resources:', nftResources);
            toast.success(`Found ${nftResources.length} NFT resources in your wallet!`);
            nftFound = true;
            break;
          } else {
            addDebugInfo('No NFT resources found');
          }
          
          // 尝试查询 NFT 事件
          try {
            addDebugInfo(`Checking NFT events at ${nftContractAddress}`);
            const eventsUrl = `${endpoint}/accounts/${address}/events/${nftContractAddress}/nft_minted_events`;
            addDebugInfo(`Events URL: ${eventsUrl}`);
            
            const eventsResponse = await fetch(eventsUrl);
            
            if (eventsResponse.ok) {
              const events = await eventsResponse.json();
              if (Array.isArray(events) && events.length > 0) {
                addDebugInfo(`Found ${events.length} NFT events`);
                console.log('Found NFT events:', events);
                toast.success(`Found ${events.length} NFT events in your wallet!`);
                nftFound = true;
                break;
              } else {
                addDebugInfo('No NFT events found');
              }
            } else {
              addDebugInfo(`Events endpoint returned status: ${eventsResponse.status}`);
            }
          } catch (eventError) {
            console.log('Error fetching NFT events:', eventError);
            addDebugInfo(`Error fetching NFT events: ${eventError instanceof Error ? eventError.message : String(eventError)}`);
          }
        } catch (endpointError) {
          console.log(`Error with endpoint ${endpoint}:`, endpointError);
          addDebugInfo(`Error with endpoint ${endpoint}: ${endpointError instanceof Error ? endpointError.message : String(endpointError)}`);
        }
      }
      
      if (!nftFound) {
        addDebugInfo('No NFTs found for address');
        console.log('No NFTs found for address:', address);
        toast.info('No NFTs found in your wallet');
      }
    } catch (error) {
      console.error('Error checking NFT contract:', error);
      addDebugInfo(`Error checking NFT contract: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 断开连接
  const disconnectWallet = async () => {
    if (typeof window === 'undefined') return;

    try {
      addDebugInfo('Disconnecting wallet');
      // 使用区块链钱包上下文中的断开连接函数
      await useBlockchainWallet().disconnectWallet();
      addDebugInfo('Wallet disconnected');
      toast.info('Petra wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting from Petra wallet:', error);
      addDebugInfo(`Error disconnecting: ${error instanceof Error ? error.message : String(error)}`);
      toast.error('Failed to disconnect from Petra wallet');
    }
  };

  // 查询特定地址的代币余额
  const fetchTokenBalance = async () => {
    try {
      if (!aptosAddress) {
        addDebugInfo('No wallet address available');
        return '0';
      }

      addDebugInfo(`Fetching balance for address: ${aptosAddress}`);
      addDebugInfo(`Token address: ${tokenAddress}`);

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
          addDebugInfo(`Trying Aptos endpoint: ${endpoint}`);
          
          // 方法 1: 使用 SDK 的 getAccountResources 方法
          const resourcesUrl = `${endpoint}/accounts/${aptosAddress}/resources`;
          addDebugInfo(`Resources URL: ${resourcesUrl}`);
          
          const response = await fetch(resourcesUrl);
          
          if (!response.ok) {
            addDebugInfo(`Endpoint ${endpoint} returned status: ${response.status}`);
            continue;
          }
          
          const resources = await response.json();
          
          if (!Array.isArray(resources)) {
            addDebugInfo(`Endpoint ${endpoint} returned invalid data format`);
            continue;
          }
          
          addDebugInfo(`Found ${resources.length} resources`);
          
          // 对于原生APT代币
          if (tokenAddress === '0x1::aptos_coin::AptosCoin') {
            const aptCoinResource = resources.find((r) => 
              r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
            );
            
            if (aptCoinResource?.data?.coin?.value) {
              const balanceInApt = parseFloat(aptCoinResource.data.coin.value) / 10**8;
              balance = balanceInApt.toFixed(4);
              success = true;
              addDebugInfo(`Successfully retrieved APT balance: ${balance}`);
              break;
            } else {
              addDebugInfo('APT coin resource not found or invalid format');
            }
          } else {
            // 对于其他代币
            const coinType = `0x1::coin::CoinStore<${tokenAddress}>`;
            addDebugInfo(`Looking for resource type: ${coinType}`);
            
            const resource = resources.find((r) => r.type === coinType);
            
            if (resource?.data?.coin?.value) {
              const balanceInApt = parseFloat(resource.data.coin.value) / 10**8;
              balance = balanceInApt.toFixed(4);
              success = true;
              addDebugInfo(`Successfully retrieved token balance: ${balance}`);
              break;
            } else {
              addDebugInfo('Token resource not found or invalid format');
            }
          }
          
          addDebugInfo(`No matching resource found in endpoint ${endpoint}`);
        } catch (endpointError) {
          console.log(`Error connecting to endpoint: ${endpoint}`, endpointError);
          addDebugInfo(`Error with endpoint ${endpoint}: ${endpointError instanceof Error ? endpointError.message : String(endpointError)}`);
          // 继续尝试下一个端点
        }
      }
      
      if (!success) {
        addDebugInfo('All Aptos network endpoints failed or no matching resource found');
        return '0';
      }
      
      return balance;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      addDebugInfo(`Error fetching token balance: ${error instanceof Error ? error.message : String(error)}`);
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
      
      {/* 调试信息 */}
      {debugInfo.length > 0 && (
        <div className="mt-4 p-2 bg-gray-100 rounded-md text-xs max-h-40 overflow-y-auto">
          <h4 className="font-bold mb-1">Debug Info:</h4>
          {debugInfo.map((info, index) => (
            <div key={index} className="text-gray-700">{info}</div>
          ))}
        </div>
      )}
    </div>
  );
} 