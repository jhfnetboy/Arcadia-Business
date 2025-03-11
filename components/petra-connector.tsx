'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PetraConnectorProps {
  tokenAddress: string
  tokenSymbol?: string
}

// 为 window.aptos 添加类型定义
interface Aptos {
  connect: () => Promise<any>
  disconnect: () => Promise<any>
  isConnected: () => Promise<boolean>
  account: () => Promise<{ address: string }>
  getAccountResources: (address: string) => Promise<any[]>
}

// 扩展 Window 接口
declare global {
  interface Window {
    aptos?: Aptos
  }
}

export default function PetraConnector({ 
  tokenAddress, 
  tokenSymbol = 'APT' 
}: PetraConnectorProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // 检查是否已连接
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.aptos) {
        try {
          const isConnected = await window.aptos.isConnected()
          if (isConnected) {
            const account = await window.aptos.account()
            setAddress(account.address)
            await fetchBalance(account.address)
          }
        } catch (error) {
          console.error('Error checking Petra connection:', error)
        }
      }
    }

    checkConnection()
  }, [])

  // 监听账户变化
  useEffect(() => {
    if (typeof window === 'undefined' || !window.aptos) return

    const handleAccountChange = async () => {
      try {
        // 确保 window.aptos 存在
        if (!window.aptos) return
        
        const isConnected = await window.aptos.isConnected()
        if (isConnected) {
          const account = await window.aptos.account()
          setAddress(account.address)
          await fetchBalance(account.address)
        } else {
          setAddress(null)
          setBalance(null)
        }
      } catch (error) {
        console.error('Error handling account change:', error)
      }
    }

    // Petra 钱包目前不支持直接的账户变化事件
    // 这里使用轮询作为替代方案
    const intervalId = setInterval(handleAccountChange, 5000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  // 连接 Petra 钱包
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.aptos) {
      toast.error('Petra wallet not installed. Please install Petra wallet first.')
      return
    }

    setIsConnecting(true)

    try {
      await window.aptos.connect()
      const account = await window.aptos.account()
      setAddress(account.address)
      await fetchBalance(account.address)
      toast.success('Petra wallet connected successfully!')
    } catch (error) {
      console.error('Error connecting to Petra wallet:', error)
      toast.error('Failed to connect to Petra wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  // 断开连接
  const disconnectWallet = async () => {
    if (typeof window !== 'undefined' && window.aptos) {
      try {
        await window.aptos.disconnect()
        setAddress(null)
        setBalance(null)
        toast.info('Petra wallet disconnected')
      } catch (error) {
        console.error('Error disconnecting from Petra wallet:', error)
        toast.error('Failed to disconnect from Petra wallet')
      }
    }
  }

  // 查询代币余额
  const fetchBalance = async (walletAddress: string) => {
    if (!tokenAddress || !walletAddress || typeof window === 'undefined' || !window.aptos) return

    try {
      // 查询 Aptos 代币余额
      const resources = await window.aptos.getAccountResources(walletAddress)
      
      // 查找代币资源
      // 对于 APT，资源类型是 "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
      // 对于自定义代币，需要替换为相应的类型
      const coinType = tokenAddress === '0x1::aptos_coin::AptosCoin' 
        ? '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
        : `0x1::coin::CoinStore<${tokenAddress}>`
      
      const resource = resources.find((r: any) => r.type === coinType)
      
      if (resource && resource.data && resource.data.coin) {
        // 假设代币有8位小数（如APT）
        const balanceInApt = parseFloat(resource.data.coin.value) / 10**8
        setBalance(balanceInApt.toFixed(4))
      } else {
        setBalance('0')
      }
    } catch (error) {
      console.error('Error fetching token balance:', error)
      setBalance('Error')
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      {!address ? (
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? 'Connecting...' : 'Connect Petra Wallet'}
        </Button>
      ) : (
        <>
          <Button 
            variant="outline" 
            className="w-full bg-green-100 hover:bg-green-200 border-green-300 text-green-800"
            onClick={disconnectWallet}
          >
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Connected: {address.substring(0, 6)}...{address.substring(address.length - 4)}
            </span>
          </Button>
          
          {balance && (
            <div className="text-sm text-center">
              Balance: {balance} {tokenSymbol}
            </div>
          )}
        </>
      )}
    </div>
  )
} 