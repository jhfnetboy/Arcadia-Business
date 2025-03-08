'use server'

import { signIn, signOut } from "auth"

export async function handleSignIn(formData: FormData) {
  const provider = formData.get('provider')?.toString()
  await signIn(provider)
}

export async function handleSignOut() {
  await signOut()
} 