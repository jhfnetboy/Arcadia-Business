import { Button } from "./ui/button"
import Image from "next/image"
import { UserDropdown } from "./user-dropdown"
import { handleSignIn } from "@/app/actions"
import { Avatar, AvatarFallback } from "./ui/avatar"

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

// 获取用户名或邮箱的首字母
function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name.charAt(0).toUpperCase()
  }
  if (email) {
    return email.charAt(0).toUpperCase()
  }
  return '?'
}

// Server component for avatar display
export function UserAvatar({ user }: UserAvatarProps) {
  const initials = getInitials(user.name, user.email)
  
  return (
    <Avatar className="h-10 w-10 border-2 border-primary/10">
      {user.image ? (
        <Image 
          src={user.image}
          alt={user.name || 'User avatar'}
          width={40}
          height={40}
          className="rounded-full"
        />
      ) : (
        <AvatarFallback className="bg-primary/5">
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  )
}

// Export the combined component
export function SignOut(props: UserAvatarProps) {
  return <UserDropdown {...props} />
}
