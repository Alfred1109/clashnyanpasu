import * as React from 'react'
import { createContext, useContext, useRef, useState } from 'react'
import { cn } from '@nyanpasu/ui'
import { Box, BoxProps } from '@mui/material'

interface ScrollAreaContextValue {
  isTop: boolean
  isBottom: boolean
  scrollDirection: 'up' | 'down' | 'left' | 'right' | 'none'
  viewportRef: React.RefObject<HTMLDivElement | null>
}

const ScrollAreaContext = createContext<ScrollAreaContextValue | null>(null)

export function useScrollArea() {
  const context = useContext(ScrollAreaContext)

  if (!context) {
    throw new Error('useScrollArea must be used within a ScrollArea component')
  }

  return context
}

function useScrollTracking(threshold = 50) {
  const [isTop, setIsTop] = useState(true)
  const [isBottom, setIsBottom] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<
    'up' | 'down' | 'left' | 'right' | 'none'
  >('none')

  const lastScrollTop = useRef(0)
  const lastScrollLeft = useRef(0)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLElement
    const { scrollTop, scrollLeft, scrollHeight, clientHeight } = target

    setIsTop(scrollTop === 0)

    const isAtBottom = scrollHeight - scrollTop - clientHeight < threshold
    setIsBottom(isAtBottom)

    const deltaY = scrollTop - lastScrollTop.current
    const deltaX = scrollLeft - lastScrollLeft.current

    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > 0) {
        setScrollDirection('down')
      } else if (deltaY < 0) {
        setScrollDirection('up')
      }
    }

    lastScrollTop.current = scrollTop
    lastScrollLeft.current = scrollLeft
  }

  return { isTop, isBottom, scrollDirection, handleScroll }
}

export interface ScrollAreaProps extends BoxProps {
  className?: string
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    const viewportRef = useRef<HTMLDivElement | null>(null)
    const { isTop, isBottom, scrollDirection, handleScroll } = useScrollTracking()

    return (
      <ScrollAreaContext.Provider
        value={{
          isTop,
          isBottom,
          scrollDirection,
          viewportRef,
        }}
      >
        <Box
          ref={ref}
          className={cn('relative overflow-auto', className)}
          onScroll={handleScroll}
          {...props}
          sx={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,0.2) transparent',
            '&::-webkit-scrollbar': {
              width: '10px',
              height: '10px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(0,0,0,0.3)',
            },
            ...props.sx,
          }}
        >
          {children}
        </Box>
      </ScrollAreaContext.Provider>
    )
  }
)

ScrollArea.displayName = 'ScrollArea'

export const ScrollBar = () => null
export const ScrollAreaViewport = ScrollArea
