import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Footer from "@/components/footer"
import Header from "@/components/header"
import HtmlCleanup from "@/components/html-cleanup"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Arcadia Smart Business",
  description:
    "Arcadia Smart Business is a platform for merchants to create and manage coupons, and for players to redeem them using points.",
}

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <HtmlCleanup />
        <div className="flex h-full min-h-screen w-full flex-col justify-between">
          <Header />
          <main className="mx-auto w-full max-w-3xl flex-auto px-4 py-4 sm:px-6 md:py-6">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
