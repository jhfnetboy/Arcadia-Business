'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useBlockchainWallet } from './blockchain-wallet'

export default function WalletSectionAptos() {
  const { 
    aptosAddress, 
    aptosBalance, 
    connectAptos, 
    disconnectWallet 
  } = useBlockchainWallet()
  
  const [isConnecting, setIsConnecting] = useState(false)
  
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
  
  const handleDisconnect = async () => {
    try {
      await disconnectWallet()
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }
  
  return (
    <div className="flex items-center space-x-2">
      {aptosAddress ? (
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
      )}
    </div>
  )
} 