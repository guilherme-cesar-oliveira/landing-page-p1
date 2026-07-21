import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({
  className,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-44 w-full rounded-[4px] border border-black/70 bg-black px-5 py-4 text-lg leading-relaxed tracking-[0.01em] text-foreground shadow-[0_18px_35px_-30px_rgba(0,0,0,0.9)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-foreground-muted/85 focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
