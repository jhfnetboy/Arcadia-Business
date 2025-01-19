"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MerchantProfile, CouponCategory } from "@prisma/client"

// Promotion types from your enum
const PROMOTION_TYPES = {
  PINDUODUO_GROUP_BUYING: {
    name: "拼团购",
    affect: "price",
    calculate: "multi",
    num: 0.7,
    require_people_num: 3,
    description: "多人一起拼单，人数越多价格越低"
  },
  PINDUODUO_DIRECT_REDUCTION: {
    name: "直接优惠",
    affect: "price",
    calculate: "subtract",
    num: 20,
    description: "商品直接减去固定金额"
  },
  TAOBAO_FULL_MINUS: {
    name: "满减",
    affect: "total_order",
    calculate: "subtract",
    num: 50,
    condition: 200,
    description: "订单满特定金额可减去固定金额"
  },
  TAOBAO_COUPON: {
    name: "店铺优惠券",
    affect: "price",
    calculate: "subtract",
    num: 10,
    pay_type: "积分",
    description: "可在店铺使用的代金券"
  },
  AMAZON_PERCENTAGE_OFF: {
    name: "折扣百分比",
    affect: "price",
    calculate: "multi",
    num: 0.85,
    description: "按照商品原价打一定折扣"
  },
  AMAZON_BUNDLE_SALE: {
    name: "捆绑销售",
    affect: "total_order",
    calculate: "multi",
    condition: 2,
    num: 0.9,
    description: "多件商品打包销售，享受整体折扣"
  },
  EBAY_DAILY_DEAL: {
    name: "限时特价",
    affect: "price",
    calculate: "multi",
    num: 0.6,
    time_limit: true,
    description: "特定时间段内的超低价促销"
  },
  EBAY_COUPON_CODE: {
    name: "优惠码",
    affect: "total_order",
    calculate: "subtract",
    num: 15,
    pay_type: "积分",
    description: "使用特定优惠码享受优惠"
  }
}

type PromotionSettings = {
  name: string
  affect: "price" | "total_order"
  calculate: "multi" | "subtract"
  num: number
  require_people_num?: number
  condition?: number
  pay_type?: string
  time_limit?: boolean
  description: string
}

interface NewCouponFormProps {
  merchant: MerchantProfile
  categories: CouponCategory[]
  onSubmit: (formData: FormData) => Promise<void>
}

export default function NewCouponForm({ merchant, categories, onSubmit }: NewCouponFormProps) {
  const [selectedType, setSelectedType] = useState<keyof typeof PROMOTION_TYPES | ''>('')
  const [settings, setSettings] = useState<PromotionSettings | Record<string, never>>({})

  const handleTypeChange = (type: string) => {
    setSelectedType(type as keyof typeof PROMOTION_TYPES)
    setSettings(PROMOTION_TYPES[type as keyof typeof PROMOTION_TYPES])
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
            <Label htmlFor="pointsPrice">Points Price</Label>
            <Input 
              id="pointsPrice" 
              name="pointsPrice" 
              type="number" 
              min="1" 
              required 
            />
            <p className="text-sm text-muted-foreground">
              Your balance: {merchant.pointsBalance} points
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalQuantity">Total Quantity</Label>
            <Input 
              id="totalQuantity" 
              name="totalQuantity" 
              type="number" 
              min="1" 
              required 
            />
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
            <Button type="submit">
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