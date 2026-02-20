'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CategoryMenu } from './CategoryMenu'
import type { CategoryWithChildren } from '@/lib/types'

export function MobileNav({ tree }: { tree: CategoryWithChildren[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-80 pt-8">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-semibold text-xl text-foreground tracking-tight">
              ePresent
            </SheetTitle>
          </SheetHeader>
          <CategoryMenu
            tree={tree}
            variant="mobile"
            onClose={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
