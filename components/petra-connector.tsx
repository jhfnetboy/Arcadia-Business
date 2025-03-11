'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useBlockchainWallet } from './blockchain-wallet'

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
  const { aptosAddress, aptosBalance, updateAptosBalance } = useBlockchainWallet();

  // 获取Petra钱包
  const getPetraWallet = () => {
    if (typeof window === 'undefined') return undefined;
    
    // 使用Aptos Wallet Standard API
    if (window.aptosWallets) {
      return window.aptosWallets.find(wallet => wallet.name === 'Petra');
    }
    
    return undefined;
  };

  // 连接 Petra 钱包
  const connectWallet = async () => {
    if (typeof window === 'undefined') {
      toast.error('Browser environment not available');
      return;
    }

    const petraWallet = getPetraWallet();
    
    if (!petraWallet && !window.aptos) {
      toast.error('Petra wallet not installed. Please install Petra wallet first.');
      window.open('https://petra.app/', '_blank');
      return;
    }

    setIsConnecting(true);

    try {
      if (petraWallet) {
        // 使用新的Wallet Standard API
        await petraWallet.connect();
        const balance = await fetchTokenBalance();
        if (balance) {
          updateAptosBalance(balance);
        }
      } else if (window.aptos) {
        // 回退到旧API
        await window.aptos.connect();
        const balance = await fetchTokenBalance();
        if (balance) {
          updateAptosBalance(balance);
        }
      }
      
      toast.success('Petra wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting to Petra wallet:', error);
      toast.error('Failed to connect to Petra wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // 断开连接
  const disconnectWallet = async () => {
    if (typeof window === 'undefined') return;

    try {
      const petraWallet = getPetraWallet();
      
      if (petraWallet) {
        await petraWallet.disconnect();
      } else if (window.aptos) {
        await window.aptos.disconnect();
      }
      
      toast.info('Petra wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting from Petra wallet:', error);
      toast.error('Failed to disconnect from Petra wallet');
    }
  };

  // 查询特定地址的代币余额
  const fetchTokenBalance = async () => {
    try {
      // 使用特定地址查询余额
      // 尝试使用多个网络端点，包括测试网和主网
      const endpoints = [
        // Testnet
        `https://fullnode.testnet.aptoslabs.com/v1/accounts/${SPECIFIC_TOKEN_ADDRESS}/resources`,
        // Mainnet
        `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${SPECIFIC_TOKEN_ADDRESS}/resources`,
        // Devnet (如果适用)
        `https://fullnode.devnet.aptoslabs.com/v1/accounts/${SPECIFIC_TOKEN_ADDRESS}/resources`
      ];
      
      let resources: any[] = [];
      let responseOk = false;
      
      // 尝试所有端点，直到找到一个有效的
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            resources = await response.json();
            responseOk = true;
            console.log(`Successfully connected to Aptos endpoint: ${endpoint}`);
            break;
          }
        } catch (endpointError) {
          console.log(`Failed to connect to endpoint: ${endpoint}`, endpointError);
          // 继续尝试下一个端点
        }
      }
      
      // 如果所有端点都失败
      if (!responseOk || !resources || !Array.isArray(resources)) {
        console.error('All Aptos network endpoints failed');
        return '0';
      }
      
      // 对于原生APT代币
      if (tokenAddress === '0x1::aptos_coin::AptosCoin') {
        const aptCoinResource = resources.find((r: any) => 
          r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
        );
        
        if (aptCoinResource && aptCoinResource.data && aptCoinResource.data.coin) {
          const balanceInApt = parseFloat(aptCoinResource.data.coin.value) / 10**8;
          return balanceInApt.toFixed(4);
        } else {
          return '0';
        }
      }
      
      // 对于其他代币
      const coinType = `0x1::coin::CoinStore<${tokenAddress}>`;
      const resource = resources.find((r: any) => r.type === coinType);
      
      if (resource && resource.data && resource.data.coin) {
        const balanceInApt = parseFloat(resource.data.coin.value) / 10**8;
        return balanceInApt.toFixed(4);
      } else {
        return '0';
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0'; // 返回0而不是错误，避免UI显示错误
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