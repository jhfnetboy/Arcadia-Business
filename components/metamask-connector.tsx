'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useBlockchainWallet } from './blockchain-wallet'

interface MetamaskConnectorProps {
  tokenContractAddress: string
  tokenSymbol?: string
}

export default function MetamaskConnector({ 
  tokenContractAddress, 
  tokenSymbol = 'HERO' 
}: MetamaskConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const { ethereumAddress, ethereumBalance, updateEthereumBalance } = useBlockchainWallet();

  // 连接MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not installed. Please install MetaMask first.')
      return
    }

    setIsConnecting(true)

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const balance = await fetchBalance(accounts[0])
      if (balance) {
        updateEthereumBalance(balance)
      }
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
    toast.info('MetaMask disconnected')
  }

  // 查询代币余额
  const fetchBalance = async (walletAddress: string) => {
    if (!tokenContractAddress || !walletAddress || !window.ethereum) return null

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
      
      return balanceInEther.toFixed(4)
    } catch (error) {
      console.error('Error fetching token balance:', error)
      return 'Error'
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      {!ethereumAddress ? (
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
              Connected: {ethereumAddress.substring(0, 6)}...{ethereumAddress.substring(ethereumAddress.length - 4)}
            </span>
          </Button>
          
          {ethereumBalance && (
            <div className="text-sm text-center">
              Balance: {ethereumBalance} {tokenSymbol}
            </div>
          )}
        </>
      )}
    </div>
  )
} 