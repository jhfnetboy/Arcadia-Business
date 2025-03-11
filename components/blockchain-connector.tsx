'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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

interface BlockchainConnectorProps {
  heroData: any
  onSaveComplete?: (txHash: string) => void
}

export default function BlockchainConnector({ heroData, onSaveComplete }: BlockchainConnectorProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // 检查是否安装了 MetaMask
  const checkIfMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }
  
  // 连接 MetaMask
  const connectWallet = async () => {
    if (!checkIfMetaMaskInstalled()) {
      toast.error('MetaMask not installed. Please install MetaMask first.')
      return
    }
    
    setIsConnecting(true)
    
    try {
      // 请求账户访问
      const accounts = await window.ethereum!.request({ method: 'eth_requestAccounts' })
      
      if (accounts.length > 0) {
        setAddress(accounts[0])
        toast.success('Wallet connected successfully!')
        
        // 监听账户变化
        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts.length === 0) {
            // 用户断开了连接
            setAddress(null)
          } else {
            // 用户切换了账户
            setAddress(accounts[0])
          }
        }
        
        window.ethereum!.on('accountsChanged', handleAccountsChanged)
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }
  
  // 保存英雄数据到区块链
  const saveHeroToBlockchain = async () => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }
    
    if (!heroData) {
      toast.error('No hero data to save')
      return
    }
    
    setIsSaving(true)
    
    try {
      // 这里是一个模拟的区块链交易
      // 在实际应用中，你需要调用智能合约函数
      
      // 模拟区块链交易延迟
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 生成一个假的交易哈希
      const txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      
      toast.success('Hero saved to blockchain successfully!')
      
      // 调用回调函数，传递交易哈希
      if (onSaveComplete) {
        onSaveComplete(txHash)
      }
    } catch (error) {
      console.error('Error saving to blockchain:', error)
      toast.error('Failed to save hero to blockchain')
    } finally {
      setIsSaving(false)
    }
  }
  
  // 检查初始连接状态
  useEffect(() => {
    const checkInitialConnection = async () => {
      if (checkIfMetaMaskInstalled() && window.ethereum!.selectedAddress) {
        setAddress(window.ethereum!.selectedAddress)
      }
    }
    
    checkInitialConnection()
  }, [])
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Blockchain Connection</h2>
      
      {!address ? (
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="w-full mb-4"
        >
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
        </Button>
      ) : (
        <>
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-medium">
              Connected: {address.substring(0, 6)}...{address.substring(address.length - 4)}
            </p>
          </div>
          
          <Button 
            onClick={saveHeroToBlockchain} 
            disabled={isSaving || !heroData}
            className="w-full"
          >
            {isSaving ? 'Saving...' : 'Save Hero to Blockchain'}
          </Button>
        </>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Connect your MetaMask wallet to save your hero data on the blockchain.</p>
        <p className="mt-1">This will create a permanent record of your hero's achievements.</p>
      </div>
    </div>
  )
} 