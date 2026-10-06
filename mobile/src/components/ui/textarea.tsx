import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-background placeholder:text-muted-foreground flex min-h-28 w-full rounded-xl border px-3 py-3 text-base shadow-xs outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
