"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useLoadScript, GoogleMap } from "@react-google-maps/api"
import { useFormStatus } from "react-dom"
import { MultipleImageUpload } from "./image-upload"

// Chiang Mai coordinates
const CHIANG_MAI = { lat: 18.7883, lng: 98.9853 }
const libraries: ("places")[] = ["places"]
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_UPLOAD_SIZE = 1024 * 1024 // 1MB

// Function to compress image
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > 1024) {
          height = Math.round((height * 1024) / width)
          width = 1024
        }
      } else {
        if (height > 1024) {
          width = Math.round((width * 1024) / height)
          height = 1024
        }
      }

      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.7)) // Compress with 0.7 quality
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Registering..." : "Register"}
    </Button>
  )
}

export default function NewMerchantForm({
  onSubmit
}: {
  onSubmit: (formData: FormData) => Promise<void>
}) {
  const [location, setLocation] = useState(CHIANG_MAI)
  const [address, setAddress] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    businessName: '',
    description: ''
  })
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | google.maps.marker.AdvancedMarkerElement | null>(null);

  // Add debug logs
  console.log('Map ID:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID)
  console.log('API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
    libraries,
    mapIds: [process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID as string]
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    
    // Check file sizes
    const oversizedFiles = Array.from(e.target.files).filter(file => file.size > MAX_IMAGE_SIZE)
    if (oversizedFiles.length > 0) {
      setError(`Some images are too large (max ${MAX_IMAGE_SIZE / 1024 / 1024}MB): ${oversizedFiles.map(f => f.name).join(", ")}`)
      e.target.value = "" // Clear the input
      return
    }

    setIsProcessing(true)
    setError(null)
    
    try {
      // Compress and convert files to base64
      const compressedImages = await Promise.all(
        Array.from(e.target.files).map(compressImage)
      )
      
      // Check compressed sizes
      const tooLarge = compressedImages.some(dataUrl => {
        const base64Length = dataUrl.split(',')[1].length
        const sizeInBytes = base64Length * 0.75 // Convert base64 length to bytes
        return sizeInBytes > MAX_UPLOAD_SIZE
      })
      
      if (tooLarge) {
        setError("Images are still too large after compression. Please try smaller images.")
        e.target.value = ""
        return
      }

      setImages([...images, ...compressedImages])
    } catch (error) {
      console.error("Error processing images:", error)
      setError("Failed to process images. Please try again.")
      e.target.value = "" // Clear the input
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const onMapLoad = async (map: google.maps.Map) => {
    setMap(map);
    if (window.google && location) {
      try {
        // Import the marker library
        const markerLib = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
        
        // Create and set the marker
        const marker = new markerLib.AdvancedMarkerElement({
          map,
          position: location,
          title: formData.businessName || 'New Business'
        });
        setMarker(marker);
      } catch (error) {
        console.error('Error creating marker:', error);
        // Fallback to basic marker if AdvancedMarkerElement is not available
        const marker = new google.maps.Marker({
          map,
          position: location,
          title: formData.businessName || 'New Business'
        });
        setMarker(marker);
      }
    }
  };

  useEffect(() => {
    if (map && marker && location) {
      if (marker instanceof google.maps.Marker) {
        marker.setPosition(location);
      } else {
        marker.position = location;
      }
    }
  }, [map, marker, location]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setError(null);
      if (images.length < 3) {
        setError("Please upload at least 3 images");
        return;
      }

      const formData = new FormData(event.currentTarget);

      // Add form data values from state
      formData.set("businessName", formData.get("businessName") as string || '');
      formData.set("description", formData.get("description") as string || '');

      // Add images to form data
      for (const url of images) {
        formData.append("images", url);
      }

      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while registering");
      console.error("Registration error:", err);
    }
  }

  const renderMap = () => {
    if (!window.google) return null;
    
    return (
      <GoogleMap
        zoom={15}
        center={location}
        mapContainerClassName="w-full h-[400px] rounded-lg"
        onClick={handleMapClick}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
        }}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Register as a Merchant</CardTitle>
          <CardDescription>
            Please provide your business information to start issuing coupons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input 
              id="businessName" 
              name="businessName" 
              value={formData.businessName}
              onChange={handleInputChange}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Business Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={formData.description}
              onChange={handleInputChange}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              name="address" 
              value={address}
              onChange={handleAddressChange}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            {isLoaded ? renderMap() : (
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
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  )
} 