'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useBlockchainWallet } from './blockchain-wallet'
import { ethers } from 'ethers'

interface MetamaskConnectorProps {
  tokenContractAddress: string
  tokenSymbol?: string
}

export default function MetamaskConnector({ 
  tokenContractAddress, 
  tokenSymbol = 'HERO' 
}: MetamaskConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const { 
    ethereumAddress, 
    ethereumBalance, 
    updateEthereumBalance, 
    connectEthereum 
  } = useBlockchainWallet();

  // 连接MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not installed. Please install MetaMask first.')
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    setIsConnecting(true)

    try {
      // 使用区块链钱包上下文中的连接函数
      await connectEthereum()
      
      // 连接成功后查询余额
      if (ethereumAddress) {
        const balance = await fetchBalance(ethereumAddress)
        if (balance) {
          updateEthereumBalance(balance)
        }
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error)
      toast.error('Failed to connect to MetaMask')
    } finally {
      setIsConnecting(false)
    }
  }

  // 断开连接
  const disconnectWallet = async () => {
    try {
      // 使用区块链钱包上下文中的断开连接函数
      await useBlockchainWallet().disconnectWallet()
      toast.info('MetaMask disconnected')
    } catch (error) {
      console.error('Error disconnecting from MetaMask:', error)
      toast.error('Failed to disconnect from MetaMask')
    }
  }

  // 查询代币余额
  const fetchBalance = async (walletAddress: string) => {
    if (!tokenContractAddress || !walletAddress || !window.ethereum) return null

    try {
      // 使用 ethers.js 查询余额
      const provider = new ethers.providers.Web3Provider(window.ethereum as any)
      
      try {
        // 先尝试获取 ETH 余额
        const ethBalance = await provider.getBalance(walletAddress)
        const ethBalanceFormatted = ethers.utils.formatEther(ethBalance)
        console.log('ETH Balance:', ethBalanceFormatted)
        
        // 如果代币地址是 ETH，直接返回 ETH 余额
        if (tokenContractAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
          return parseFloat(ethBalanceFormatted).toFixed(4)
        }
      } catch (ethError) {
        console.error('Error fetching ETH balance:', ethError)
      }
      
      // 尝试作为 ERC20 代币查询
      try {
        // ERC20 ABI
        const erc20Abi = [
          'function balanceOf(address owner) view returns (uint256)',
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)'
        ]
        
        const tokenContract = new ethers.Contract(tokenContractAddress, erc20Abi, provider)
        
        // 获取代币精度
        let decimals = 18
        try {
          decimals = await tokenContract.decimals()
        } catch (error) {
          console.log('Error getting decimals, using default 18:', error)
        }
        
        // 获取余额
        const balance = await tokenContract.balanceOf(walletAddress)
        const formattedBalance = ethers.utils.formatUnits(balance, decimals)
        console.log(`Token Balance (${tokenSymbol}):`, formattedBalance)
        
        return parseFloat(formattedBalance).toFixed(4)
      } catch (tokenError) {
        console.error('Error fetching token balance:', tokenError)
        
        // 尝试使用低级调用
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
      }
    } catch (error) {
      console.error('Error fetching token balance:', error)
      return '0'
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