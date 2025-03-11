'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PetraConnectorProps {
  tokenAddress: string
  tokenSymbol?: string
}

// 为 Aptos Wallet Standard 添加类型定义
interface AptosWallet {
  name: string
  icon: string
  connect: () => Promise<{ address: string }>
  disconnect: () => Promise<void>
  network: () => Promise<string>
  signAndSubmitTransaction: (transaction: any) => Promise<any>
  signTransaction: (transaction: any) => Promise<any>
  signMessage: (message: any) => Promise<any>
  isConnected: () => Promise<boolean>
  account: () => Promise<{ address: string }>
}

interface AptosWalletStandard {
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ address: string }>
  disconnect: () => Promise<void>
  isConnected: () => Promise<boolean>
  account: () => Promise<{ address: string }>
  network: () => Promise<{ name: string }>
  signAndSubmitTransaction: (transaction: any) => Promise<any>
  signTransaction: (transaction: any) => Promise<any>
  signMessage: (message: any) => Promise<any>
}

// 扩展 Window 接口
declare global {
  interface Window {
    aptos?: AptosWalletStandard
    aptosWallets?: AptosWallet[]
  }
}

export default function PetraConnector({ 
  tokenAddress, 
  tokenSymbol = 'APT' 
}: PetraConnectorProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // 获取Petra钱包
  const getPetraWallet = (): AptosWallet | undefined => {
    if (typeof window === 'undefined') return undefined;
    
    // 使用Aptos Wallet Standard API
    if (window.aptosWallets) {
      return window.aptosWallets.find(wallet => wallet.name === 'Petra');
    }
    
    return undefined;
  };

  // 检查是否已连接
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        const petraWallet = getPetraWallet();
        
        if (petraWallet) {
          const isConnected = await petraWallet.isConnected();
          if (isConnected) {
            const account = await petraWallet.account();
            setAddress(account.address);
            await fetchBalance(account.address);
          }
        } else if (window.aptos) {
          // 回退到旧API
          const isConnected = await window.aptos.isConnected();
          if (isConnected) {
            const account = await window.aptos.account();
            setAddress(account.address);
            await fetchBalance(account.address);
          }
        }
      } catch (error) {
        console.error('Error checking Petra connection:', error);
      }
    };

    checkConnection();
  }, []);

  // 监听账户变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAccountChange = async () => {
      try {
        const petraWallet = getPetraWallet();
        
        if (petraWallet) {
          const isConnected = await petraWallet.isConnected();
          if (isConnected) {
            const account = await petraWallet.account();
            setAddress(account.address);
            await fetchBalance(account.address);
          } else {
            setAddress(null);
            setBalance(null);
          }
        } else if (window.aptos) {
          // 回退到旧API
          const isConnected = await window.aptos.isConnected();
          if (isConnected) {
            const account = await window.aptos.account();
            setAddress(account.address);
            await fetchBalance(account.address);
          } else {
            setAddress(null);
            setBalance(null);
          }
        }
      } catch (error) {
        console.error('Error handling account change:', error);
      }
    };

    // Petra 钱包目前不支持直接的账户变化事件
    // 这里使用轮询作为替代方案
    const intervalId = setInterval(handleAccountChange, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

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
        const account = await petraWallet.connect();
        setAddress(account.address);
        await fetchBalance(account.address);
      } else if (window.aptos) {
        // 回退到旧API
        await window.aptos.connect();
        const account = await window.aptos.account();
        setAddress(account.address);
        await fetchBalance(account.address);
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
      
      setAddress(null);
      setBalance(null);
      toast.info('Petra wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting from Petra wallet:', error);
      toast.error('Failed to disconnect from Petra wallet');
    }
  };

  // 查询代币余额
  const fetchBalance = async (walletAddress: string) => {
    if (!tokenAddress || !walletAddress || typeof window === 'undefined') return;

    try {
      // 使用Aptos API获取余额
      const response = await fetch(`https://fullnode.mainnet.aptoslabs.com/v1/accounts/${walletAddress}/resources`);
      const resources = await response.json();
      
      // 对于原生APT代币
      if (tokenAddress === '0x1::aptos_coin::AptosCoin') {
        const aptCoinResource = resources.find((r: any) => 
          r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
        );
        
        if (aptCoinResource && aptCoinResource.data && aptCoinResource.data.coin) {
          const balanceInApt = parseFloat(aptCoinResource.data.coin.value) / 10**8;
          setBalance(balanceInApt.toFixed(4));
        } else {
          setBalance('0');
        }
        return;
      }
      
      // 对于其他代币
      const coinType = `0x1::coin::CoinStore<${tokenAddress}>`;
      const resource = resources.find((r: any) => r.type === coinType);
      
      if (resource && resource.data && resource.data.coin) {
        const balanceInApt = parseFloat(resource.data.coin.value) / 10**8;
        setBalance(balanceInApt.toFixed(4));
      } else {
        setBalance('0');
      }
    } catch (error) {
      console.error('Error fetching token balance:', error);
      setBalance('Error');
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      {!address ? (
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
              Connected: {address.substring(0, 6)}...{address.substring(address.length - 4)}
            </span>
          </Button>
          
          {balance && (
            <div className="text-sm text-center">
              Balance: {balance} {tokenSymbol}
            </div>
          )}
        </>
      )}
    </div>
  );
} 