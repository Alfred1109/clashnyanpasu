import { ComponentProps } from 'react'
import { cn } from '@nyanpasu/ui'
import { Divider } from '@mui/material'

export interface SeparatorProps extends Omit<ComponentProps<typeof Divider>, 'orientation'> {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

export function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <Divider
      data-slot="separator"
      orientation={orientation}
      className={cn('bg-outline-variant/50 shrink-0', className)}
      {...props}
    />
  )
}
