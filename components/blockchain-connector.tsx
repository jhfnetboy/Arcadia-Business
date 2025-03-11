'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// 定义英雄数据类型
interface Hero {
  name: string
  points: number
  level: number
  userId: string
  createdAt: string
  txHash?: string
}

interface BlockchainConnectorProps {
  heroData: Hero
  onSaveComplete: (txHash: string) => void
}

export default function BlockchainConnector({ heroData, onSaveComplete }: BlockchainConnectorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  
  // 连接钱包
  const connectWallet = async () => {
    try {
      // 检查是否有MetaMask
      if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        setIsSaving(true)
        
        // 请求账户访问
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0])
          setWalletConnected(true)
          toast.success('Wallet connected!')
        } else {
          toast.error('No accounts found')
        }
      } else {
        toast.error('MetaMask not installed')
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setIsSaving(false)
    }
  }
  
  // 保存到区块链
  const saveToBlockchain = async () => {
    if (!walletConnected) {
      toast.error('Please connect your wallet first')
      return
    }
    
    setIsSaving(true)
    
    try {
      // 这里是模拟区块链交互
      // 在实际应用中，这里应该调用智能合约
      
      // 模拟区块链交易延迟
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 生成模拟交易哈希
      const txHash = '0x' + Array(40).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
      
      // 调用回调函数
      onSaveComplete(txHash)
      
      toast.success('Hero data saved to blockchain!')
    } catch (error) {
      console.error('Error saving to blockchain:', error)
      toast.error('Failed to save to blockchain')
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">Blockchain Connection</h3>
      
      <div className="flex flex-col space-y-2 flex-grow">
        {!walletConnected ? (
          <Button 
            onClick={connectWallet} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="w-full bg-green-100 hover:bg-green-200 border-green-300 text-green-800"
              onClick={() => {}}
            >
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Connected: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </span>
            </Button>
            
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={saveToBlockchain}
              disabled={isSaving || !!heroData.txHash}
            >
              {isSaving ? 'Saving...' : heroData.txHash ? 'Already Saved' : 'Save to Blockchain'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
} 