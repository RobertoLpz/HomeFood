import * as React from 'react'

import { cn } from '@/lib/utils'

function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        'border-input bg-background flex h-12 w-full rounded-xl border px-3 text-base outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]',
        className,
      )}
      {...props}
    />
  )
}

export { NativeSelect }
