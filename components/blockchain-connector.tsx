'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <CardTitle>Blockchain Connection</CardTitle>
        <CardDescription>Save your hero data to the blockchain</CardDescription>
      </CardHeader>
      
      <CardContent>
        {walletConnected ? (
          <div className="space-y-2">
            <p className="text-sm">Connected Wallet:</p>
            <p className="text-xs font-mono bg-gray-100 p-2 rounded">
              {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
            </p>
            <p className="text-xs mt-2">
              Hero: <strong>{heroData.name}</strong> (Level {heroData.level})
            </p>
          </div>
        ) : (
          <p className="text-sm">Connect your wallet to save your hero data to the blockchain and earn rewards.</p>
        )}
      </CardContent>
      
      <CardFooter>
        {walletConnected ? (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={saveToBlockchain}
            disabled={isSaving || !!heroData.txHash}
          >
            {isSaving ? 'Saving...' : heroData.txHash ? 'Already Saved' : 'Save to Blockchain'}
          </Button>
        ) : (
          <Button 
            className="w-full"
            onClick={connectWallet}
            disabled={isSaving}
          >
            {isSaving ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 