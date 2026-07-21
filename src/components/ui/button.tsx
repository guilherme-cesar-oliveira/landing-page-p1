import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-sm font-semibold uppercase tracking-[0.22em] transition-[transform,background-color,color,border-color,box-shadow,filter] duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-55 active:translate-y-0 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        gold:
          'bg-brand text-brand-foreground shadow-[0_18px_42px_-22px_rgba(217,171,67,0.72),inset_0_1px_0_rgba(255,255,255,0.22)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_24px_56px_-24px_rgba(217,171,67,0.88),inset_0_1px_0_rgba(255,255,255,0.3)]',
        outline:
          'border border-brand bg-black/10 text-brand shadow-[inset_0_0_0_1px_rgba(217,171,67,0.18),0_20px_50px_-36px_rgba(217,171,67,0.48)] hover:-translate-y-0.5 hover:bg-brand/8 hover:text-[#f4c65c] hover:shadow-[inset_0_0_0_1px_rgba(217,171,67,0.28),0_24px_56px_-32px_rgba(217,171,67,0.62)]',
        whatsapp:
          'bg-whatsapp text-whatsapp-foreground shadow-[0_18px_44px_-22px_rgba(67,167,109,0.74),inset_0_1px_0_rgba(255,255,255,0.14)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_24px_56px_-24px_rgba(67,167,109,0.88),inset_0_1px_0_rgba(255,255,255,0.2)]',
        ghost: 'text-foreground hover:text-brand',
      },
      size: {
        default: 'h-14 px-6 text-sm sm:h-15 sm:px-7',
        lg: 'h-16 px-7 text-base sm:px-8',
        icon: 'size-14 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'gold',
      size: 'default',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
