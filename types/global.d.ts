// 为 window.ethereum 添加类型定义
interface Ethereum {
  request: (args: any) => Promise<any>
  on: (event: string, callback: any) => void
  removeListener: (event: string, callback: any) => void
  selectedAddress?: string
  isConnected?: () => boolean
}

// 扩展 Window 接口
declare global {
  interface Window {
    ethereum?: Ethereum
  }
}

export {}; 