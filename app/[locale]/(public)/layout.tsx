import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PendingUserBanner } from '@/components/layout/PendingUserBanner'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <PendingUserBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
