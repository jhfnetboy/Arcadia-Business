'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// 为 window.ethereum 添加类型定义
declare global {
  interface Window {
    ethereum?: {
      request: (args: any) => Promise<any>
      on: (event: string, callback: any) => void
      removeListener: (event: string, callback: any) => void
    }
  }
}

interface BlockchainConnectorProps {
  heroData: any
  onSaveComplete?: (txHash: string) => void
}

export default function BlockchainConnector({ heroData, onSaveComplete }: BlockchainConnectorProps) {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 检查是否安装了 MetaMask
  const checkIfMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
  }

  // 连接 MetaMask
  const connectWallet = async () => {
    if (!checkIfMetaMaskInstalled()) {
      toast.error('Please install MetaMask to use this feature')
      return
    }

    try {
      setIsConnecting(true)
      const accounts = await window.ethereum!.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0])
      toast.success('Wallet connected successfully')
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  // 监听账户变化
  useEffect(() => {
    if (checkIfMetaMaskInstalled()) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null)
        } else if (accounts[0] !== account) {
          setAccount(accounts[0])
        }
      }

      window.ethereum!.on('accountsChanged', handleAccountsChanged)

      // 检查是否已经连接
      window.ethereum!.request({ method: 'eth_accounts' })
        .then(handleAccountsChanged)
        .catch((err: any) => console.error(err))

      return () => {
        window.ethereum!.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [account])

  // 保存英雄数据到区块链
  const saveHeroToBlockchain = async () => {
    if (!account) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!heroData) {
      toast.error('No hero data to save')
      return
    }

    try {
      setIsSaving(true)
      
      // 准备交易数据
      const heroDataString = JSON.stringify({
        name: heroData.name,
        points: heroData.points,
        level: heroData.level,
        timestamp: new Date().toISOString()
      })
      
      // 创建消息哈希
      const msgParams = JSON.stringify({
        domain: {
          name: 'Arcadia Game',
          version: '1',
          chainId: 1, // 以太坊主网
        },
        message: {
          heroData: heroDataString,
          action: 'save_hero_data',
        },
        primaryType: 'HeroData',
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
          ],
          HeroData: [
            { name: 'heroData', type: 'string' },
            { name: 'action', type: 'string' },
          ],
        },
      })

      // 请求用户签名
      const signature = await window.ethereum!.request({
        method: 'eth_signTypedData_v4',
        params: [account, msgParams],
        from: account,
      })

      // 模拟上链操作（实际项目中应该调用真实的区块链交互）
      const mockTxHash = `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`
      
      // 调用 API 保存签名和交易哈希
      const response = await fetch('/api/hero/blockchain-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heroData,
          signature,
          txHash: mockTxHash,
          walletAddress: account
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Hero data saved to blockchain')
        if (onSaveComplete) {
          onSaveComplete(mockTxHash)
        }
      } else {
        toast.error('Failed to save hero data to blockchain')
      }
    } catch (error) {
      console.error('Error saving hero data to blockchain:', error)
      toast.error('Error saving hero data to blockchain')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="font-semibold mb-3">Blockchain Integration</h3>
      
      {!account ? (
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="w-full mb-2"
        >
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
        </Button>
      ) : (
        <div>
          <p className="text-sm mb-2">
            Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
          </p>
          <Button 
            onClick={saveHeroToBlockchain} 
            disabled={isSaving || !heroData}
            className="w-full"
          >
            {isSaving ? 'Saving to Blockchain...' : 'Save Hero to Blockchain'}
          </Button>
        </div>
      )}
      
      <p className="text-xs mt-2 text-gray-500">
        Save your hero data to the blockchain for permanent storage and verification.
      </p>
    </div>
  )
} 