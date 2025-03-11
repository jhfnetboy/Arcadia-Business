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
  const [isConnecting, setIsConnecting] = useState(false)

  // 触发钱包连接事件
  const triggerWalletEvent = (type: string, address: string | null, network: NetworkType) => {
    try {
      const event = new CustomEvent('walletEvent', {
        detail: { type, address, network },
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
      console.log(`Dispatched wallet event: ${type} for ${network} address ${address}`);
    } catch (error) {
      console.error('Error dispatching wallet event:', error);
    }
  };

  // 当以太坊地址变化时触发事件
  useEffect(() => {
    if (ethereumAddress) {
      triggerWalletEvent('connect', ethereumAddress, 'ethereum');
    }
  }, [ethereumAddress]);

  // 当Aptos地址变化时触发事件
  useEffect(() => {
    if (aptosAddress) {
      triggerWalletEvent('connect', aptosAddress, 'aptos');
    }
  }, [aptosAddress]);

  // 连接以太坊钱包
  const connectEthereum = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('MetaMask not installed');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      setIsConnecting(true);
      
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
        
        // 获取网络信息
        const network = await provider.getNetwork();
        console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);
        
        // 触发连接事件
        triggerWalletEvent('connect', accounts[0], 'ethereum');
        
        // 查询 NFT 合约
        try {
          // 获取环境变量中的 NFT 合约地址
          const nftContractAddress = process.env.NEXT_PUBLIC_HERO_NFT_ADDRESS || 
                                    process.env.VITE_HERO_NFT_ADDRESS || 
                                    ETHEREUM_CONTRACTS.HERO_NFT_ADDRESS;
          
          if (nftContractAddress) {
            console.log('Checking NFT contract:', nftContractAddress);
            
            // 简化版的 ERC721 ABI
            const erc721Abi = [
              'function balanceOf(address owner) view returns (uint256)',
              'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
              'function tokenURI(uint256 tokenId) view returns (string)'
            ];
            
            // 创建合约实例
            const nftContract = new ethers.Contract(nftContractAddress, erc721Abi, provider);
            
            // 检查用户拥有的 NFT 数量
            const nftBalance = await nftContract.balanceOf(accounts[0]);
            console.log('NFT balance:', nftBalance.toString());
            
            if (nftBalance.toNumber() > 0) {
              toast.success(`Found ${nftBalance.toString()} NFTs in your wallet!`);
            } else {
              toast.info('No NFTs found in your wallet');
            }
          } else {
            console.warn('NFT contract address not found in environment variables');
          }
        } catch (nftError) {
          console.error('Error checking NFT contract:', nftError);
        }
        
        toast.success('MetaMask connected successfully!');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      toast.error('Failed to connect to MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  // 连接 Aptos 钱包
  const connectAptos = async () => {
    if (typeof window === 'undefined') {
      console.error('Browser environment not available');
      return;
    }
    
    try {
      setIsConnecting(true);
      console.log('Attempting to connect to Aptos wallet...');
      
      // 检查是否有 window.aptos
      if (!window.aptos) {
        console.log('window.aptos not found, checking window.aptosWallets');
        
        // 检查是否有 window.aptosWallets
        if (!window.aptosWallets) {
          const errorMsg = 'Petra wallet not installed';
          console.error(errorMsg);
          toast.error(errorMsg);
          window.open('https://petra.app/', '_blank');
          setIsConnecting(false);
          return;
        }
        
        // 查找 Petra 钱包
        const petra = window.aptosWallets.find((wallet: any) => wallet.name === 'Petra');
        if (!petra) {
          const errorMsg = 'Petra wallet not found';
          console.error(errorMsg);
          toast.error(errorMsg);
          window.open('https://petra.app/', '_blank');
          setIsConnecting(false);
          return;
        }
        
        // 连接 Petra 钱包
        try {
          await petra.connect();
          const account = await petra.account();
          if (account && account.address) {
            setAptosAddress(account.address);
            setCurrentNetwork('aptos');
            
            // 触发连接事件
            triggerWalletEvent('connect', account.address, 'aptos');
            
            // 获取余额
            const provider = new ethers.providers.Web3Provider(window.aptos as any);
            const balance = await provider.getBalance(account.address);
            const aptosBalance = ethers.utils.formatEther(balance);
            setAptosBalance(parseFloat(aptosBalance).toFixed(4));
            
            // 获取网络信息
            const network = await provider.getNetwork();
            console.log('Connected to Aptos network:', network);
            
            toast.success('Petra wallet connected successfully!');
          } else {
            console.error('No address in Petra wallet response');
            toast.error('Failed to get address from Petra wallet');
          }
        } catch (connectError) {
          console.error('Error connecting to Petra wallet:', connectError);
          toast.error('Failed to connect to Petra wallet');
          throw connectError;
        }
      } else {
        console.log('Using window.aptos to connect');
        
        // 使用 window.aptos 连接
        try {
          const response = await window.aptos.connect();
          console.log('Aptos wallet connected:', response);
          
          if (response && response.address) {
            setAptosAddress(response.address);
            setCurrentNetwork('aptos');
            
            // 获取网络信息
            try {
              const network = await window.aptos.network();
              console.log('Connected to Aptos network:', network);
            } catch (networkError) {
              console.error('Error getting Aptos network:', networkError);
            }
            
            // 获取账户信息
            try {
              const account = await window.aptos.account();
              console.log('Aptos account info:', account);
            } catch (accountError) {
              console.error('Error getting Aptos account:', accountError);
            }
            
            // 触发连接事件
            triggerWalletEvent('connect', response.address, 'aptos');
            
            toast.success('Petra wallet connected successfully!');
          } else {
            console.error('No address in Aptos wallet response');
            toast.error('Failed to get address from Aptos wallet');
          }
        } catch (error) {
          console.error('Error connecting to Aptos wallet:', error);
          toast.error('Failed to connect to Aptos wallet');
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in connectAptos:', error);
      toast.error('Failed to connect to Aptos wallet');
    } finally {
      setIsConnecting(false);
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

      window.ethereum!.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [currentNetwork]);

  // 监听 Aptos 账户变化
  useEffect(() => {
    if (typeof window === 'undefined' || !window.aptos) return;
    
    let lastKnownAddress = aptosAddress;
    
    // 使用轮询检查 Aptos 钱包状态变化
    const checkAptosWallet = async () => {
      try {
        // 检查钱包是否已连接
        const isConnected = await window.aptos!.isConnected();
        
        if (isConnected) {
          // 获取当前账户
          const account = await window.aptos!.account();
          
          if (account && account.address !== lastKnownAddress) {
            // 地址变化了
            lastKnownAddress = account.address;
            setAptosAddress(account.address);
            console.log('Aptos address changed:', account.address);
          }
        } else if (lastKnownAddress) {
          // 钱包断开连接
          lastKnownAddress = null;
          setAptosAddress(null);
          setAptosBalance(null);
          if (currentNetwork === 'aptos') {
            setCurrentNetwork(null);
          }
          console.log('Aptos wallet disconnected');
        }
      } catch (error) {
        console.error('Error checking Aptos wallet:', error);
      }
    };
    
    // 立即检查一次
    checkAptosWallet();
    
    // 设置轮询间隔
    const intervalId = setInterval(checkAptosWallet, 2000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [aptosAddress, currentNetwork]);

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
  const { currentNetwork, setCurrentNetwork } = useBlockchainWallet();
  
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <Tabs 
        defaultValue={currentNetwork || 'ethereum'} 
        onValueChange={(value) => {
          if (value === 'ethereum' || value === 'aptos') {
            setCurrentNetwork(value as NetworkType);
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ethereum">
            Ethereum
            {currentNetwork === 'ethereum' && (
              <span className="ml-1 text-xs text-gray-500">(Ethereum)</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="aptos">
            Aptos
            {currentNetwork === 'aptos' && (
              <span className="ml-1 text-xs text-gray-500">(Aptos)</span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="ethereum">
          <MetamaskConnector 
            tokenContractAddress={ETHEREUM_CONTRACTS.HERO_COIN_ADDRESS} 
            tokenSymbol={TOKEN_SYMBOLS.ETHEREUM} 
          />
        </TabsContent>
        <TabsContent value="aptos">
          <PetraConnector 
            tokenAddress={APTOS_CONTRACTS.MOVE_HERO_COIN_ADDRESS} 
            tokenSymbol={TOKEN_SYMBOLS.APTOS} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 