import { Button } from "./ui/button"
import Image from "next/image"
import { UserDropdown } from "./user-dropdown"
import { handleSignIn } from "@/app/actions"

export function SignIn({
  provider,
  ...props
}: { provider?: string } & React.ComponentPropsWithRef<typeof Button>) {
  return (
    <form action={handleSignIn}>
      <input type="hidden" name="provider" value={provider || ''} />
      <Button {...props}>Sign In</Button>
    </form>
  )
}

interface UserAvatarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

// Server component for avatar display
export function UserAvatar({ user }: UserAvatarProps) {
  const avatarUrl = user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email || 'guest'}`
  
  return (
    <div className="relative w-10 h-10">
      {avatarUrl && (
        <Image 
          src={avatarUrl}
          alt={user.name || 'User avatar'}
          width={40}
          height={40}
          className="rounded-full"
        />
      )}
    </div>
  )
}

// Export the combined component
export function SignOut(props: UserAvatarProps) {
  return <UserDropdown {...props} />
}
