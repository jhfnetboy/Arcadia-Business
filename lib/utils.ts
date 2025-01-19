import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generatePasscode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let passcode = ''
  for (let i = 0; i < 8; i++) {
    passcode += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return passcode
}
