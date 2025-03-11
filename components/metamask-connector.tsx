'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface MetamaskConnectorProps {
  tokenContractAddress: string
  tokenSymbol?: string
}

declare global {
  interface Window {
    ethereum?: any
  }
}

export default function MetamaskConnector({ 
  tokenContractAddress, 
  tokenSymbol = 'HERO' 
}: MetamaskConnectorProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // 检查是否已连接
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        setAddress(window.ethereum.selectedAddress)
        await fetchBalance(window.ethereum.selectedAddress)
      }
    }

    checkConnection()
  }, [])

  // 监听账户变化
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null)
        setBalance(null)
      } else {
        setAddress(accounts[0])
        fetchBalance(accounts[0])
      }
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
    }
  }, [])

  // 连接MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not installed. Please install MetaMask first.')
      return
    }

    setIsConnecting(true)

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAddress(accounts[0])
      await fetchBalance(accounts[0])
      toast.success('MetaMask connected successfully!')
    } catch (error) {
      console.error('Error connecting to MetaMask:', error)
      toast.error('Failed to connect to MetaMask')
    } finally {
      setIsConnecting(false)
    }
  }

  // 断开连接
  const disconnectWallet = () => {
    setAddress(null)
    setBalance(null)
    toast.info('MetaMask disconnected')
  }

  // 查询代币余额
  const fetchBalance = async (walletAddress: string) => {
    if (!tokenContractAddress || !walletAddress) return

    try {
      // ERC20 balanceOf 函数的 ABI 编码
      const data = `0x70a08231000000000000000000000000${walletAddress.slice(2)}`
      
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [
          {
            to: tokenContractAddress,
            data
          },
          'latest'
        ]
      })
      
      // 将十六进制结果转换为十进制
      const balanceInWei = parseInt(result, 16).toString()
      
      // 假设代币有18位小数（如ETH）
      const balanceInEther = parseFloat(balanceInWei) / 10**18
      
      setBalance(balanceInEther.toFixed(4))
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
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
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