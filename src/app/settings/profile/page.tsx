"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Loader2 } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { Separator } from "@/components/ui/separator"
import { Logo } from "@/components/logo"
import { authService } from "@/api/services/auth"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional(),
  bio: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfileSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [useDefaultIcon, setUseDefaultIcon] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingProfile, setIsFetchingProfile] = useState(true)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { user, updateUser } = useAuth()
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
    },
  })

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsFetchingProfile(true)
        const userData = await authService.me()
        
        // Update form with user data
        form.reset({
          name: userData.name || "",
          email: userData.email || "",
          bio: userData.bio || "",
        })

        // Set profile image
        if (userData.image_url) {
          setProfileImage(userData.image_url)
          setUseDefaultIcon(false)
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch profile data")
      } finally {
        setIsFetchingProfile(false)
      }
    }

    fetchProfile()
  }, [form, toast])

  async function onSubmit(data: ProfileFormValues) {
    try {
      setIsLoading(true)
      
      const updatedUser = await authService.updateProfile({
        name: data.name,
        bio: data.bio,
      })

      // Update the auth context with new user data
      if (updateUser) {
        updateUser(updatedUser)
      }
      toast.success("Profile updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (800KB = 819200 bytes)
      if (file.size > 819200) {
        toast.error("File size exceeds 800KB limit")
        return
      }

      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        toast.error("Invalid file type. Only JPG, PNG, and GIF are allowed")
        return
      }

      try {
        setIsUploadingImage(true)

        // Preview the image locally
        const reader = new FileReader()
        reader.onload = (e) => {
          setProfileImage(e.target?.result as string)
          setUseDefaultIcon(false)
        }
        reader.readAsDataURL(file)

        // Upload to server
        const updatedUser = await authService.updateProfilePicture(file)
        
        // Update the auth context with new user data
        if (updateUser) {
          updateUser(updatedUser)
        }

        setProfileImage(updatedUser.image_url || null)
        
        toast.success("Profile picture updated successfully")
      } catch (error: any) {
        toast.error(error.message || "Failed to upload profile picture")
      } finally {
        setIsUploadingImage(false)
      }
    }
  }

  const handleReset = () => {
    setProfileImage(null)
    setUseDefaultIcon(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isFetchingProfile) {
    return (
      <BaseLayout title="Profile Settings" description="Manage your profile information">
        <div className="flex items-center justify-center min-h-100">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout title="Profile Settings" description="Manage your profile information">
      <div className="px-4 lg:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture Section */}
                <div className="flex items-center gap-6">
                  {useDefaultIcon ? (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary">
                      <Logo size={56} />
                    </div>
                  ) : (
                    <Avatar className="h-20 w-20 rounded-full border-2 border-primary">
                      <AvatarImage src={profileImage || undefined} />
                      <AvatarFallback>{getInitials(form.getValues('name') || user?.name || 'U')}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button 
                        type="button"
                        variant="default" 
                        size="sm"
                        onClick={handleFileUpload}
                        disabled={isUploadingImage}
                        className="cursor-pointer"
                      >
                        {isUploadingImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload new photo
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={handleReset}
                        disabled={isUploadingImage}
                        className="cursor-pointer"
                      >
                        Reset
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Allowed JPG, GIF or PNG. Max size of 800KB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/gif,image/png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email (Read-only) */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email" 
                            {...field} 
                            disabled
                            className="bg-muted cursor-not-allowed"
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Bio - Full Width */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us a little about yourself..." 
                          className="min-h-25"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* User Stats (Read-only) */}
                {user?.currentRating && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FormLabel>Role</FormLabel>
                      <Input 
                        value={user.role || 'USER'} 
                        disabled 
                        className="mt-2 bg-muted cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <FormLabel>Current Rating</FormLabel>
                      <Input 
                        value={user.currentRating || 0} 
                        disabled 
                        className="mt-2 bg-muted cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-start gap-3">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => form.reset()}
                    disabled={isLoading}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </BaseLayout>
  )
}
