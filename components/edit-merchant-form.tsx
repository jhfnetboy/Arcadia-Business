"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useLoadScript, GoogleMap, Marker } from "@react-google-maps/api"
import type { MerchantProfile } from "@prisma/client"
import { MultipleImageUpload } from "./image-upload"

const libraries: ("places")[] = ["places"]

interface EditMerchantFormProps {
  merchant: MerchantProfile
  onSubmit: (formData: FormData) => Promise<void>
}

export default function EditMerchantForm({ merchant, onSubmit }: EditMerchantFormProps) {
  const [location, setLocation] = useState(() => {
    try {
      return typeof merchant.location === 'string' 
        ? JSON.parse(merchant.location) 
        : merchant.location
    } catch {
      return { lat: 18.7883, lng: 98.9853 } // Default to Chiang Mai if parse fails
    }
  })
  const [address, setAddress] = useState(merchant.address ?? '')
  const [images, setImages] = useState<string[]>(merchant.images)
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
    libraries,
  })

  useEffect(() => {
    if (isLoaded) {
      setGeocoder(new google.maps.Geocoder())
    }
  }, [isLoaded])

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !geocoder) return
    
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    setLocation({ lat, lng })

    try {
      const response = await geocoder.geocode({ location: { lat, lng } })
      if (response.results[0]) {
        setAddress(response.results[0].formatted_address)
      }
    } catch (error) {
      console.error("Geocoding error:", error)
    }
  }

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value
    setAddress(newAddress)

    if (!geocoder || !newAddress) return

    try {
      const response = await geocoder.geocode({ address: newAddress })
      if (response.results[0]?.geometry?.location) {
        const lat = response.results[0].geometry.location.lat()
        const lng = response.results[0].geometry.location.lng()
        setLocation({ lat, lng })
      }
    } catch (error) {
      console.error("Geocoding error:", error)
    }
  }

  async function handleSubmit(formData: FormData) {
    try {
      if (images.length < 3) {
        throw new Error("Please upload at least 3 images")
      }
      
      // Add images to form data
      for (const url of images) {
        formData.append("images", url)
      }
      
      await onSubmit(formData)
    } catch (error) {
      console.error("Error submitting form:", error)
      alert(error instanceof Error ? error.message : "An error occurred")
    }
  }

  return (
    <form action={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Business Profile</CardTitle>
          <CardDescription>
            Update your business information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input 
              id="businessName" 
              name="businessName" 
              defaultValue={merchant.businessName}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Business Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              defaultValue={merchant.description || ''}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              name="address" 
              value={address || ''}
              onChange={handleAddressChange}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            {isLoaded ? (
              <div className="h-[300px] w-full rounded-md border">
                <GoogleMap
                  zoom={13}
                  center={location}
                  mapContainerClassName="w-full h-full rounded-md"
                  onClick={handleMapClick}
                >
                  <Marker position={location} />
                </GoogleMap>
              </div>
            ) : (
              <div>Loading map...</div>
            )}
            <input
              type="hidden"
              name="location"
              value={JSON.stringify(location)}
            />
          </div>

          <div className="space-y-2">
            <Label>Business Images (at least 3)</Label>
            <MultipleImageUpload
              currentImages={images}
              onUpload={setImages}
              maxImages={10}
              className="mt-2"
            />
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex gap-2">
            <Button type="submit" disabled={images.length < 3}>
              Save Changes
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