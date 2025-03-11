'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MetamaskConnector from './metamask-connector'
import PetraConnector from './petra-connector'
import { ETHEREUM_CONTRACTS, APTOS_CONTRACTS, TOKEN_SYMBOLS } from '@/lib/constants'
import { toast } from 'sonner'

// 定义区块链钱包上下文类型
interface BlockchainWalletContextType {
  ethereumAddress: string | null;
  aptosAddress: string | null;
  ethereumBalance: string | null;
  aptosBalance: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isConnecting: boolean;
  updateEthereumBalance: (balance: string) => void;
  updateAptosBalance: (balance: string) => void;
  ethereumNetwork: string | null;
  aptosNetwork: string | null;
}

// 创建上下文
const BlockchainWalletContext = createContext<BlockchainWalletContextType>({
  ethereumAddress: null,
  aptosAddress: null,
  ethereumBalance: null,
  aptosBalance: null,
  activeTab: 'ethereum',
  setActiveTab: () => {},
  isConnecting: false,
  updateEthereumBalance: () => {},
  updateAptosBalance: () => {},
  ethereumNetwork: null,
  aptosNetwork: null,
});

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

// 创建Provider组件
export function BlockchainWalletProvider({ children }: { children: ReactNode }) {
  const [ethereumAddress, setEthereumAddress] = useState<string | null>(null);
  const [aptosAddress, setAptosAddress] = useState<string | null>(null);
  const [ethereumBalance, setEthereumBalance] = useState<string | null>(null);
  const [aptosBalance, setAptosBalance] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ethereum');
  const [isConnecting, setIsConnecting] = useState(false);
  const [ethereumNetwork, setEthereumNetwork] = useState<string | null>(null);
  const [aptosNetwork, setAptosNetwork] = useState<string | null>(null);

  // 检查以太坊网络
  const checkEthereumNetwork = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const chainId = await window.ethereum!.request({ method: 'eth_chainId' });
        const networkName = ETHEREUM_NETWORKS[parseInt(chainId, 16).toString()] || `Chain ID: ${parseInt(chainId, 16)}`;
        setEthereumNetwork(networkName);
        console.log('Current Ethereum network:', networkName);
      } catch (error) {
        console.error('Error checking Ethereum network:', error);
        setEthereumNetwork(null);
      }
    }
  };

  // 监听MetaMask连接状态
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setEthereumAddress(accounts[0]);
          fetchEthereumBalance(accounts[0]);
        } else {
          setEthereumAddress(null);
          setEthereumBalance(null);
        }
      };

      // 监听网络变化
      const handleChainChanged = (chainId: string) => {
        const networkName = ETHEREUM_NETWORKS[parseInt(chainId, 16).toString()] || `Chain ID: ${parseInt(chainId, 16)}`;
        setEthereumNetwork(networkName);
        console.log('Ethereum network changed:', networkName);
        
        // 当网络变化时，重新获取余额
        if (ethereumAddress) {
          fetchEthereumBalance(ethereumAddress);
        }
      };

      // 初始检查
      window.ethereum!.request({ method: 'eth_accounts' })
        .then(handleAccountsChanged)
        .catch(console.error);

      // 检查网络
      checkEthereumNetwork();

      // 监听账户变化
      window.ethereum!.on('accountsChanged', handleAccountsChanged);
      
      // 监听网络变化
      window.ethereum!.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum!.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [ethereumAddress]);

  // 监听Petra钱包连接状态
  useEffect(() => {
    if (typeof window !== 'undefined' && window.aptosWallets) {
      const checkPetraConnection = async () => {
        const petraWallet = window.aptosWallets!.find(wallet => wallet.name === 'Petra');
        if (petraWallet) {
          try {
            const isConnected = await petraWallet.isConnected();
            if (isConnected) {
              const account = await petraWallet.account();
              setAptosAddress(account.address);
              
              // 检查网络
              try {
                const network = await petraWallet.network();
                setAptosNetwork(network);
                console.log('Current Aptos network:', network);
              } catch (networkError) {
                console.error('Error checking Aptos network:', networkError);
              }
              
              fetchAptosBalance();
            }
          } catch (error) {
            console.error('Error checking Petra connection:', error);
          }
        }
      };

      checkPetraConnection();
      
      // 由于Petra钱包没有直接的事件监听，我们使用轮询
      const intervalId = setInterval(checkPetraConnection, 5000);
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, []);

  // 查询以太坊代币余额
  const fetchEthereumBalance = async (address: string) => {
    if (!address || !window.ethereum) return;

    try {
      // ERC20 balanceOf 函数的 ABI 编码
      const data = `0x70a08231000000000000000000000000${address.slice(2)}`;
      
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [
          {
            to: ETHEREUM_CONTRACTS.HERO_COIN_ADDRESS,
            data
          },
          'latest'
        ]
      });
      
      // 将十六进制结果转换为十进制
      const balanceInWei = parseInt(result, 16).toString();
      
      // 假设代币有18位小数（如ETH）
      const balanceInEther = parseFloat(balanceInWei) / 10**18;
      
      setEthereumBalance(balanceInEther.toFixed(4));
    } catch (error) {
      console.error('Error fetching Ethereum token balance:', error);
      setEthereumBalance('0');
      
      // 检查是否是合约不存在的错误
      if (error && (error as any).message && (error as any).message.includes('execution reverted')) {
        toast.error('Token contract not found on this network. Please switch to the correct network.');
      }
    }
  };

  // 查询Aptos代币余额
  const fetchAptosBalance = async () => {
    try {
      // 使用特定地址查询余额
      const SPECIFIC_TOKEN_ADDRESS = '0x53f7e4ab7f52b7030d5a53f343eb37c64d9a36838c5e545542e21dc7b8b4bfd8';
      
      // 尝试使用多个网络端点
      const endpoints = [
        // Testnet
        `https://fullnode.testnet.aptoslabs.com/v1/accounts/${SPECIFIC_TOKEN_ADDRESS}/resources`,
        // Mainnet
        `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${SPECIFIC_TOKEN_ADDRESS}/resources`,
        // Devnet
        `https://fullnode.devnet.aptoslabs.com/v1/accounts/${SPECIFIC_TOKEN_ADDRESS}/resources`
      ];
      
      let resources: any[] = [];
      let responseOk = false;
      let successEndpoint = '';
      
      // 尝试所有端点，直到找到一个有效的
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            resources = await response.json();
            responseOk = true;
            successEndpoint = endpoint;
            console.log(`Successfully connected to Aptos endpoint: ${endpoint}`);
            break;
          }
        } catch (endpointError) {
          console.log(`Failed to connect to endpoint: ${endpoint}`, endpointError);
        }
      }
      
      // 如果所有端点都失败
      if (!responseOk || !resources || !Array.isArray(resources)) {
        console.error('All Aptos network endpoints failed');
        setAptosBalance('0');
        return;
      }
      
      // 设置网络信息
      if (successEndpoint.includes('testnet')) {
        setAptosNetwork('Testnet');
      } else if (successEndpoint.includes('mainnet')) {
        setAptosNetwork('Mainnet');
      } else if (successEndpoint.includes('devnet')) {
        setAptosNetwork('Devnet');
      }
      
      // 对于原生APT代币
      if (APTOS_CONTRACTS.MOVE_HERO_COIN_ADDRESS === '0x1::aptos_coin::AptosCoin') {
        const aptCoinResource = resources.find((r: any) => 
          r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
        );
        
        if (aptCoinResource && aptCoinResource.data && aptCoinResource.data.coin) {
          const balanceInApt = parseFloat(aptCoinResource.data.coin.value) / 10**8;
          setAptosBalance(balanceInApt.toFixed(4));
        } else {
          setAptosBalance('0');
        }
        return;
      }
      
      // 对于其他代币
      const coinType = `0x1::coin::CoinStore<${APTOS_CONTRACTS.MOVE_HERO_COIN_ADDRESS}>`;
      const resource = resources.find((r: any) => r.type === coinType);
      
      if (resource && resource.data && resource.data.coin) {
        const balanceInApt = parseFloat(resource.data.coin.value) / 10**8;
        setAptosBalance(balanceInApt.toFixed(4));
      } else {
        setAptosBalance('0');
      }
    } catch (error) {
      console.error('Error fetching Aptos token balance:', error);
      setAptosBalance('0');
    }
  };

  // 提供上下文值
  const contextValue = {
    ethereumAddress,
    aptosAddress,
    ethereumBalance,
    aptosBalance,
    activeTab,
    setActiveTab,
    isConnecting,
    updateEthereumBalance: setEthereumBalance,
    updateAptosBalance: setAptosBalance,
    ethereumNetwork,
    aptosNetwork,
  };

  return (
    <BlockchainWalletContext.Provider value={contextValue}>
      {children}
    </BlockchainWalletContext.Provider>
  );
}

// 创建自定义Hook
export function useBlockchainWallet() {
  return useContext(BlockchainWalletContext);
}

// 区块链钱包连接组件
interface BlockchainWalletProps {
  className?: string;
}

export default function BlockchainWallet({ className = '' }: BlockchainWalletProps) {
  const { activeTab, setActiveTab, ethereumNetwork, aptosNetwork } = useBlockchainWallet();
  
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ethereum">
            Ethereum
            {ethereumNetwork && (
              <span className="ml-1 text-xs text-gray-500">({ethereumNetwork})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="aptos">
            Aptos
            {aptosNetwork && (
              <span className="ml-1 text-xs text-gray-500">({aptosNetwork})</span>
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