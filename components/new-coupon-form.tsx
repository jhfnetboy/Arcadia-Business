"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MerchantProfile, CouponCategory } from "@prisma/client"

// Promotion types with English names and base points
const PROMOTION_TYPES = {
  PINDUODUO_GROUP_BUYING: {
    name: "Group Buying Discount",
    affect: "price",
    calculate: "multi",
    num: 0.7,
    require_people_num: 3,
    description: "Get 30% off when 3 people join",
    basePoints: 8 // Base points for this type
  },
  PINDUODUO_DIRECT_REDUCTION: {
    name: "Direct Reduction",
    affect: "price",
    calculate: "subtract",
    num: 20,
    description: "Instant ¥20 off",
    basePoints: 5
  },
  TAOBAO_FULL_MINUS: {
    name: "Spend & Save",
    affect: "total_order",
    calculate: "subtract",
    num: 50,
    condition: 200,
    description: "¥50 off when spending ¥200",
    basePoints: 7
  },
  TAOBAO_COUPON: {
    name: "Store Coupon",
    affect: "price",
    calculate: "subtract",
    num: 10,
    pay_type: "积分",
    description: "¥10 off store-wide",
    basePoints: 6
  },
  AMAZON_PERCENTAGE_OFF: {
    name: "Percentage Discount",
    affect: "price",
    calculate: "multi",
    num: 0.85,
    description: "15% off everything",
    basePoints: 9
  },
  AMAZON_BUNDLE_SALE: {
    name: "Bundle Deal",
    affect: "total_order",
    calculate: "multi",
    condition: 2,
    num: 0.9,
    description: "10% off when buying 2 items",
    basePoints: 10
  },
  EBAY_DAILY_DEAL: {
    name: "Flash Sale",
    affect: "price",
    calculate: "multi",
    num: 0.6,
    time_limit: true,
    description: "40% off for limited time",
    basePoints: 8
  },
  EBAY_COUPON_CODE: {
    name: "Promo Code",
    affect: "total_order",
    calculate: "subtract",
    num: 15,
    pay_type: "积分",
    description: "¥15 off with promo code",
    basePoints: 5
  }
} as const

interface NewCouponFormProps {
  categories: CouponCategory[]
  merchant?: {
    id: string
    pointsBalance: number
  }
  defaultDates: {
    startDate: string
    endDate: string
  }
  onSubmit: (formData: FormData) => Promise<void>
}

export default function NewCouponForm({ categories, merchant, defaultDates, onSubmit }: NewCouponFormProps) {
  const [selectedType, setSelectedType] = useState<keyof typeof PROMOTION_TYPES | ''>('')
  const [settings, setSettings] = useState<typeof PROMOTION_TYPES[keyof typeof PROMOTION_TYPES] | Record<string, never>>({})
  const [quantity, setQuantity] = useState<number>(1)
  const [publishPrice, setPublishPrice] = useState<number>(0)

  // Calculate publish price when type changes
  useEffect(() => {
    if (selectedType) {
      const basePoints = PROMOTION_TYPES[selectedType].basePoints
      setPublishPrice(basePoints)
    } else {
      setPublishPrice(0)
    }
  }, [selectedType])

  const handleTypeChange = (type: string) => {
    setSelectedType(type as keyof typeof PROMOTION_TYPES)
    setSettings(PROMOTION_TYPES[type as keyof typeof PROMOTION_TYPES])
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value, 10) || 0
    setQuantity(Math.max(1, value)) // Ensure minimum value is 1
  }

  return (
    <form action={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Issue New Coupon</CardTitle>
          <CardDescription>
            Create a new coupon template for your customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Coupon Name</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select name="categoryId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Promotion Type</Label>
            <Select name="type" onValueChange={handleTypeChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a promotion type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROMOTION_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-sm text-muted-foreground">
                {PROMOTION_TYPES[selectedType].description}
              </p>
            )}
            <input 
              type="hidden" 
              name="settings" 
              value={JSON.stringify(settings)} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalQuantity">Total Quantity</Label>
            <Input 
              id="totalQuantity" 
              name="totalQuantity" 
              type="number" 
              min="1" 
              value={quantity}
              onChange={handleQuantityChange}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publishPrice">Publish Price</Label>
            <Input 
              id="publishPrice" 
              name="publishPrice" 
              type="number" 
              value={publishPrice}
              readOnly
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Total points needed to publish: {publishPrice * quantity} (Your balance: {merchant?.pointsBalance ?? 0} points)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sellPrice">Sell Price (Points)</Label>
            <Input 
              id="sellPrice" 
              name="sellPrice" 
              type="number"
              min="1"
              defaultValue="30"
              required
            />
            <p className="text-sm text-muted-foreground">
              Points required from players to purchase this coupon
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input 
                id="startDate" 
                name="startDate" 
                type="datetime-local" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input 
                id="endDate" 
                name="endDate" 
                type="datetime-local" 
                required 
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex gap-2">
            <Button type="submit" disabled={publishPrice * quantity > (merchant?.pointsBalance ?? 0)}>
              Issue Coupon
            </Button>
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
} 