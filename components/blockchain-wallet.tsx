'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MetamaskConnector from './metamask-connector'
import PetraConnector from './petra-connector'
import { ETHEREUM_CONTRACTS, APTOS_CONTRACTS, TOKEN_SYMBOLS } from '@/lib/constants'

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
});

// 创建Provider组件
export function BlockchainWalletProvider({ children }: { children: ReactNode }) {
  const [ethereumAddress, setEthereumAddress] = useState<string | null>(null);
  const [aptosAddress, setAptosAddress] = useState<string | null>(null);
  const [ethereumBalance, setEthereumBalance] = useState<string | null>(null);
  const [aptosBalance, setAptosBalance] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('ethereum');
  const [isConnecting, setIsConnecting] = useState(false);

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

      // 初始检查
      window.ethereum!.request({ method: 'eth_accounts' })
        .then(handleAccountsChanged)
        .catch(console.error);

      // 监听账户变化
      window.ethereum!.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

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
      setEthereumBalance('Error');
    }
  };

  // 查询Aptos代币余额
  const fetchAptosBalance = async () => {
    try {
      // 使用特定地址查询余额
      const SPECIFIC_TOKEN_ADDRESS = '0x53f7e4ab7f52b7030d5a53f343eb37c64d9a36838c5e545542e21dc7b8b4bfd8';
      const response = await fetch(`https://fullnode.mainnet.aptoslabs.com/v1/accounts/${SPECIFIC_TOKEN_ADDRESS}/resources`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const resources = await response.json();
      
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
      setAptosBalance('Error');
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
  const { activeTab, setActiveTab } = useBlockchainWallet();
  
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
          <TabsTrigger value="aptos">Aptos</TabsTrigger>
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