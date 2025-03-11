'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useBlockchainWallet } from './blockchain-wallet'

export default function GlobalWalletConnect() {
  const { 
    ethereumAddress, 
    aptosAddress, 
    ethereumBalance, 
    aptosBalance, 
    connectEthereum, 
    connectAptos, 
    disconnectWallet,
    currentNetwork
  } = useBlockchainWallet()
  
  const [isConnecting, setIsConnecting] = useState(false)
  const pathname = usePathname()
  
  // 确定当前网络
  const isAptosPage = pathname?.includes('/aptos')
  
  // 处理以太坊连接
  const handleConnectEthereum = async () => {
    setIsConnecting(true)
    try {
      await connectEthereum()
    } catch (error) {
      console.error('Error connecting to Ethereum:', error)
    } finally {
      setIsConnecting(false)
    }
  }
  
  // 处理Aptos连接
  const handleConnectAptos = async () => {
    setIsConnecting(true)
    try {
      await connectAptos()
    } catch (error) {
      console.error('Error connecting to Aptos:', error)
    } finally {
      setIsConnecting(false)
    }
  }
  
  // 处理断开连接
  const handleDisconnect = async () => {
    try {
      await disconnectWallet()
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }
  
  // 根据当前页面显示相应的钱包连接
  return (
    <div className="flex items-center space-x-2">
      {isAptosPage ? (
        // Aptos钱包连接
        aptosAddress ? (
          <div className="flex items-center space-x-2">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-2 px-3 text-xs">
                <div className="font-medium">Aptos Connected</div>
                <div className="text-gray-500 truncate max-w-[120px]">
                  {aptosAddress.slice(0, 6)}...{aptosAddress.slice(-4)}
                </div>
                {aptosBalance && (
                  <div className="text-green-600 font-medium">
                    {aptosBalance} APT
                  </div>
                )}
              </CardContent>
            </Card>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnectAptos}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Aptos'}
          </Button>
        )
      ) : (
        // 以太坊钱包连接
        ethereumAddress ? (
          <div className="flex items-center space-x-2">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-2 px-3 text-xs">
                <div className="font-medium">Ethereum Connected</div>
                <div className="text-gray-500 truncate max-w-[120px]">
                  {ethereumAddress.slice(0, 6)}...{ethereumAddress.slice(-4)}
                </div>
                {ethereumBalance && (
                  <div className="text-green-600 font-medium">
                    {ethereumBalance} ETH
                  </div>
                )}
                {currentNetwork && (
                  <div className="text-xs text-gray-500">
                    Network: {currentNetwork}
                  </div>
                )}
              </CardContent>
            </Card>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnectEthereum}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Ethereum'}
          </Button>
        )
      )}
    </div>
  )
} 