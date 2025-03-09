'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import WriteOffForm from "@/components/write-off-form"

interface VerificationResult {
  status: string
  isExpired: boolean
  daysLeft: number
  merchantName: string
  startDate: string
  endDate: string
}

interface CouponType {
  totalQuantity: number
  remainingQuantity: number
  status: string
  issuedCoupons: {
    status: string
  }[]
}

interface Stats {
  pointsBalance: number
  totalCoupons: {
    types: number
    quantity: number
  }
  activeCoupons: {
    types: number
    quantity: number
  }
  redeemedCoupons: number
}

interface MerchantData {
  user: {
    merchantProfile: {
      businessName: string
      description: string
    }
  }
  stats: Stats
}

interface CouponCheckResult {
  id: string
  name: string
  description: string
  playerName: string
  playerEmail: string
  promotionType: string
  discountType: string
  discountValue: number
  status: string
  createdAt: string
  expiresAt: string
}

export default function MerchantDashboard() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState('')
  const [data, setData] = useState<MerchantData | null>(null)
  const [loading, setLoading] = useState(true)
  const [noProfile, setNoProfile] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/merchant/profile')
        const result = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/auth/signin?callbackUrl=/merchant")
            return
          }
          if (response.status === 404 && result.error === "Merchant profile not found") {
            setNoProfile(true)
            setLoading(false)
            return
          }
          throw new Error(result.error || "Failed to load merchant profile")
        }

        setData(result)
      } catch (error) {
        console.error("Error loading data:", error)
        setError(error instanceof Error ? error.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleVerify = async () => {
    if (!code) {
      setError('Please enter a coupon code')
      return
    }

    try {
      const response = await fetch('/api/verify-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify coupon')
      }

      setVerificationResult(result)
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to verify coupon')
      setVerificationResult(null)
    }
  }

  const checkCoupon = async (formData: FormData) => {
    const code = formData.get('passcode')
    if (!code || typeof code !== 'string') {
      throw new Error('Please enter a valid coupon code')
    }

    const response = await fetch('/api/write-off', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'check', code }),
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to check coupon')
    }

    return result as CouponCheckResult
  }

  const redeemCoupon = async (id: string) => {
    const response = await fetch('/api/write-off', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'redeem', id }),
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to redeem coupon')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-lg font-medium mb-2">Loading...</div>
        <div className="text-sm text-muted-foreground">Please wait while we load your merchant profile</div>
      </div>
    </div>
  }

  if (noProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Welcome to Merchant Dashboard</h1>
          <p className="text-muted-foreground mb-4">
            It looks like you haven't set up your merchant profile yet.
            Create one now to start managing your coupons and transactions.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/merchant/new">Become a Merchant</Link>
        </Button>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center text-red-600">Failed to load merchant profile</div>
  }

  const { user, stats } = data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{user.merchantProfile.businessName}</h1>
          <p className="text-muted-foreground">{user.merchantProfile.description}</p>
          <Button asChild variant="link" className="h-auto p-0 text-muted-foreground hover:text-primary">
            <Link href="/merchant/edit">Edit Profile</Link>
          </Button>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/merchant/coupons">My Coupons</Link>
          </Button>
          <Button asChild>
            <Link href="/merchant/coupons/new">Issue New Coupon</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/merchant/coupons/used">Used Coupons</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/merchant/transactions">Transaction History</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Points Balance</div>
          <div className="mt-1 text-2xl font-bold">{stats.pointsBalance}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Coupons</div>
          <div className="mt-1 text-2xl font-bold">{stats.totalCoupons.quantity}</div>
          <div className="text-sm text-muted-foreground">({stats.totalCoupons.types} types)</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Active Coupons</div>
          <div className="mt-1 text-2xl font-bold">{stats.activeCoupons.quantity}</div>
          <div className="text-sm text-muted-foreground">({stats.activeCoupons.types} types)</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Redeemed Coupons</div>
          <div className="mt-1 text-2xl font-bold">{stats.redeemedCoupons}</div>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Write Off Coupons</h2>
        <WriteOffForm checkCoupon={checkCoupon} redeemCoupon={redeemCoupon} />
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Verify Coupon</h2>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                className="flex-1 px-3 py-2 border rounded-md"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button onClick={handleVerify}>Verify</Button>
            </div>
            
            {verificationResult && (
              <div className="mt-4 p-4 border rounded-md space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="font-medium">{verificationResult.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Merchant:</span>
                  <span className="font-medium">{verificationResult.merchantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Valid Period:</span>
                  <span className="font-medium">
                    {new Date(verificationResult.startDate).toLocaleDateString()} - {new Date(verificationResult.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Time Left:</span>
                  <span className={`font-medium ${verificationResult.isExpired ? 'text-red-500' : 'text-green-500'}`}>
                    {verificationResult.isExpired ? 'Expired' : `${verificationResult.daysLeft} days`}
                  </span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-4 border rounded-md bg-red-50 text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y">
          {/* Recent Activity Section */}
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Popular Coupons</h2>
        </div>
        <div className="divide-y">
          {/* Popular Coupons Section */}
        </div>
      </div>
    </div>
  )
} 