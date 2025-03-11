'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MetamaskConnector from './metamask-connector'
import PetraConnector from './petra-connector'
import { ETHEREUM_CONTRACTS, APTOS_CONTRACTS, TOKEN_SYMBOLS } from '@/lib/constants'

type NetworkType = 'ethereum' | 'aptos' | null;

interface BlockchainWalletContextType {
  ethereumAddress: string | null
  aptosAddress: string | null
  ethereumBalance: string | null
  aptosBalance: string | null
  currentNetwork: NetworkType
  updateEthereumBalance: (balance: string) => void
  updateAptosBalance: (balance: string) => void
  setCurrentNetwork: (network: NetworkType) => void
  connectEthereum: () => Promise<void>
  connectAptos: () => Promise<void>
  disconnectWallet: () => Promise<void>
}

const BlockchainWalletContext = createContext<BlockchainWalletContextType>({
  ethereumAddress: null,
  aptosAddress: null,
  ethereumBalance: null,
  aptosBalance: null,
  currentNetwork: null,
  updateEthereumBalance: () => {},
  updateAptosBalance: () => {},
  setCurrentNetwork: () => {},
  connectEthereum: async () => {},
  connectAptos: async () => {},
  disconnectWallet: async () => {}
})

// 网络ID到名称的映射
const ETHEREUM_NETWORKS: Record<string, string> = {
  '1': 'Ethereum Mainnet',
  '3': 'Ropsten Testnet',
  '4': 'Rinkeby Testnet',
  '5': 'Goerli Testnet',
  '42': 'Kovan Testnet',
  '56': 'Binance Smart Chain',
  '97': 'BSC Testnet',
  '137': 'Polygon Mainnet',
  '80001': 'Mumbai Testnet',
  '43114': 'Avalanche Mainnet',
  '43113': 'Avalanche Testnet',
  '42161': 'Arbitrum One',
  '421613': 'Arbitrum Goerli',
};

export function BlockchainWalletProvider({ children }: { children: React.ReactNode }) {
  const [ethereumAddress, setEthereumAddress] = useState<string | null>(null)
  const [aptosAddress, setAptosAddress] = useState<string | null>(null)
  const [ethereumBalance, setEthereumBalance] = useState<string | null>(null)
  const [aptosBalance, setAptosBalance] = useState<string | null>(null)
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>(null)

  // 连接以太坊钱包
  const connectEthereum = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('MetaMask not installed');
      return;
    }

    try {
      // 请求账户访问
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setEthereumAddress(accounts[0]);
        setCurrentNetwork('ethereum');
        
        // 获取余额
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);
        const balance = await provider.getBalance(accounts[0]);
        const etherBalance = ethers.utils.formatEther(balance);
        setEthereumBalance(parseFloat(etherBalance).toFixed(4));
        
        toast.success('MetaMask connected successfully!');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      toast.error('Failed to connect to MetaMask');
    }
  };

  // 连接 Aptos 钱包
  const connectAptos = async () => {
    if (typeof window === 'undefined') {
      toast.error('Browser environment not available');
      return;
    }

    const petraWallet = window.aptos;
    
    if (!petraWallet) {
      toast.error('Petra wallet not installed');
      window.open('https://petra.app/', '_blank');
      return;
    }

    try {
      const response = await petraWallet.connect();
      const address = response.address;
      setAptosAddress(address);
      setCurrentNetwork('aptos');
      toast.success('Petra wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting to Petra wallet:', error);
      toast.error('Failed to connect to Petra wallet');
    }
  };

  // 断开钱包连接
  const disconnectWallet = async () => {
    if (currentNetwork === 'ethereum') {
      setEthereumAddress(null);
      setEthereumBalance(null);
    } else if (currentNetwork === 'aptos') {
      try {
        if (window.aptos) {
          await window.aptos.disconnect();
        }
      } catch (error) {
        console.error('Error disconnecting from Petra:', error);
      }
      setAptosAddress(null);
      setAptosBalance(null);
    }
    setCurrentNetwork(null);
  };

  // 监听以太坊账户变化
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setEthereumAddress(null);
          setEthereumBalance(null);
          if (currentNetwork === 'ethereum') {
            setCurrentNetwork(null);
          }
        } else if (currentNetwork === 'ethereum') {
          setEthereumAddress(accounts[0]);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [currentNetwork]);

  // 监听 Aptos 账户变化
  useEffect(() => {
    if (typeof window !== 'undefined' && window.aptos) {
      const handleAccountChange = (account: any) => {
        if (!account) {
          setAptosAddress(null);
          setAptosBalance(null);
          if (currentNetwork === 'aptos') {
            setCurrentNetwork(null);
          }
        } else if (currentNetwork === 'aptos') {
          setAptosAddress(account.address);
        }
      };

      window.aptos.onAccountChange(handleAccountChange);
      return () => {
        // Cleanup if needed
      };
    }
  }, [currentNetwork]);

  const value = {
    ethereumAddress,
    aptosAddress,
    ethereumBalance,
    aptosBalance,
    currentNetwork,
    updateEthereumBalance: setEthereumBalance,
    updateAptosBalance: setAptosBalance,
    setCurrentNetwork,
    connectEthereum,
    connectAptos,
    disconnectWallet
  };

  return (
    <BlockchainWalletContext.Provider value={value}>
      {children}
    </BlockchainWalletContext.Provider>
  );
}

export const useBlockchainWallet = () => useContext(BlockchainWalletContext);

// 区块链钱包连接组件
interface BlockchainWalletProps {
  className?: string;
}

export default function BlockchainWallet({ className = '' }: BlockchainWalletProps) {
  const { currentNetwork } = useBlockchainWallet();
  
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <Tabs defaultValue={currentNetwork || 'ethereum'} onValueChange={(value) => {
        if (value === 'ethereum') {
          useBlockchainWallet().setCurrentNetwork('ethereum');
        } else if (value === 'aptos') {
          useBlockchainWallet().setCurrentNetwork('aptos');
        }
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ethereum">
            Ethereum
            {currentNetwork === 'ethereum' && (
              <span className="ml-1 text-xs text-gray-500">({ETHEREUM_NETWORKS[currentNetwork]})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="aptos">
            Aptos
            {currentNetwork === 'aptos' && (
              <span className="ml-1 text-xs text-gray-500">({ETHEREUM_NETWORKS[currentNetwork]})</span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ethereum" className="mt-4">
          <MetamaskConnector 
            tokenContractAddress={ETHEREUM_CONTRACTS.HERO_COIN_ADDRESS}
            tokenSymbol={TOKEN_SYMBOLS.ETHEREUM}
          />
        </TabsContent>
        <TabsContent value="aptos" className="mt-4">
          <PetraConnector 
            tokenAddress={APTOS_CONTRACTS.MOVE_HERO_COIN_ADDRESS}
            tokenSymbol={TOKEN_SYMBOLS.APTOS}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 