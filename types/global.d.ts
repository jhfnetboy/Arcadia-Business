// 为 window.ethereum 添加类型定义
interface Ethereum {
  request: (args: any) => Promise<any>
  on: (event: string, callback: any) => void
  removeListener: (event: string, callback: any) => void
  selectedAddress?: string
  isConnected?: () => boolean
}

// 为 window.aptosWallets 添加类型定义
interface AptosWallet {
  name: string;
  icon: string;
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  network: () => Promise<string>;
  signAndSubmitTransaction: (transaction: any) => Promise<any>;
  signTransaction: (transaction: any) => Promise<any>;
  signMessage: (message: any) => Promise<any>;
  isConnected: () => Promise<boolean>;
  account: () => Promise<{ address: string }>;
}

// 为 window.aptos 添加类型定义
interface AptosWalletStandard {
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  isConnected: () => Promise<boolean>;
  account: () => Promise<{ address: string }>;
  network: () => Promise<{ name: string }>;
  signAndSubmitTransaction: (transaction: any) => Promise<any>;
  signTransaction: (transaction: any) => Promise<any>;
  signMessage: (message: any) => Promise<any>;
}

// 扩展 Window 接口
declare global {
  interface Window {
    ethereum?: Ethereum;
    aptosWallets?: AptosWallet[];
    aptos?: AptosWalletStandard;
  }
}

export {}; 