"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MerchantProfile, CouponCategory } from "@prisma/client"
import { ImageUpload } from "./image-upload"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface NewCouponFormProps {
  categories: CouponCategory[]
  promotionTypes: {
    type: string
    name: string
    affect: string
    calculate: string
    num: number
    require_people_num?: number
    condition?: number
    pay_type?: string
    description: string
    basePoints: number
  }[]
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

export default function NewCouponForm({ 
  categories, 
  promotionTypes,
  merchant, 
  defaultDates, 
  onSubmit 
}: NewCouponFormProps) {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [publishCost, setPublishCost] = useState(0)
  const [sellPrice, setSellPrice] = useState(0)
  const [image, setImage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Log promotion types when component mounts
  useEffect(() => {
    console.log('Promotion Types in component:', promotionTypes)
  }, [promotionTypes])

  // Calculate publish cost and sell price when type or quantity changes
  useEffect(() => {
    if (selectedType) {
      const promotionType = promotionTypes.find(pt => pt.type === selectedType)
      console.log('Selected promotion type:', promotionType)
      if (promotionType) {
        const cost = promotionType.basePoints * quantity
        console.log('Calculating cost:', { 
          type: selectedType,
          basePoints: promotionType.basePoints, 
          quantity, 
          cost 
        })
        setPublishCost(cost)
        // Set default sell price to 120% of the base points
        setSellPrice(Math.round(promotionType.basePoints * 1.2))
      }
    } else {
      setPublishCost(0)
      setSellPrice(0)
    }
  }, [selectedType, quantity, promotionTypes])

  const handleTypeChange = (type: string) => {
    console.log('Type changed to:', type)
    const promotionType = promotionTypes.find(pt => pt.type === type)
    console.log('Selected promotion type data:', promotionType)
    setSelectedType(type)
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = Number.parseInt(e.target.value, 10) || 0
    console.log('Quantity changed to:', newQuantity)
    setQuantity(Math.max(1, newQuantity)) // Ensure minimum value is 1
    const promotionType = promotionTypes.find(pt => pt.type === selectedType)
    if (promotionType) {
      setPublishCost(promotionType.basePoints * newQuantity)
    }
  }

  const handleSellPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = Number.parseInt(e.target.value, 10) || 0
    setSellPrice(Math.max(0, newPrice)) // Ensure minimum value is 0
  }

  async function handleSubmit(formData: FormData) {
    try {
      setIsSubmitting(true)
      // Add sell price to form data
      formData.append("sellPrice", sellPrice.toString())
      // If no image is uploaded, use the default image path
      const imagePath = image || '/logo.png'
      formData.append("image", imagePath)
      await onSubmit(formData)
      router.push('/merchant/coupons')
      router.refresh()
    } catch (error) {
      console.error("Error submitting form:", error)
      alert(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit}>
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
            <Label>Coupon Image</Label>
            <div className="flex items-center gap-4">
              {(image || '/logo.png') && (
                <div className="relative w-32 h-32">
                  <Image
                    src={image || '/logo.png'}
                    alt="Coupon image"
                    fill
                    className="object-cover rounded-lg"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex-1">
                <ImageUpload
                  currentImage={image}
                  onUpload={setImage}
                  className="mt-2"
                />
                {!image && (
                  <p className="text-sm text-muted-foreground mt-2">
                    If no image is uploaded, a default logo will be used.
                  </p>
                )}
              </div>
            </div>
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
                {promotionTypes.map((promotionType) => (
                  <SelectItem key={promotionType.type} value={promotionType.type}>
                    {promotionType.name} ({promotionType.basePoints} points)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-sm text-muted-foreground">
                {promotionTypes.find(pt => pt.type === selectedType)?.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalQuantity">Total Quantity</Label>
            <Input 
              id="totalQuantity" 
              name="totalQuantity" 
              type="number" 
              min="1" 
              value={quantity.toString()} // Convert to string to avoid NaN warning
              onChange={handleQuantityChange}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publishCost">Publish Cost (Total Points)</Label>
            <Input 
              id="publishCost" 
              name="publishCost" 
              type="number" 
              value={publishCost.toString()}
              readOnly
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Total points needed: {publishCost} (Your balance: {merchant?.pointsBalance ?? 0} points)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sellPrice">Sell Price (Points per Coupon)</Label>
            <Input 
              id="sellPrice" 
              name="sellPrice" 
              type="number" 
              min="0"
              value={sellPrice.toString()}
              onChange={handleSellPriceChange}
              required
            />
            <p className="text-sm text-muted-foreground">
              Set the price in points that players will pay for each coupon
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input 
              id="startDate" 
              name="startDate" 
              type="datetime-local"
              defaultValue={defaultDates?.startDate?.slice(0, 16)}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input 
              id="endDate" 
              name="endDate" 
              type="datetime-local"
              defaultValue={defaultDates?.endDate?.slice(0, 16)}
              required 
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={publishCost > (merchant?.pointsBalance ?? 0) || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Coupon'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
} 