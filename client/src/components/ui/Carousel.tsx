import { useRef, useState, useCallback } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface CarouselProps {
  children: React.ReactNode
  className?: string
  itemWidth?: number // approximate px width per item for scroll calculation
}

export default function Carousel({ children, className = '', itemWidth = 220 }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = Math.max(itemWidth, el.clientWidth * 0.75)
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  return (
    <div className={`relative group/carousel ${className}`}>
      {/* Left Arrow */}
      <button
        onClick={() => scroll('left')}
        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 flex items-center justify-center bg-white border border-warm-200 rounded-full shadow-soft text-warm-700 hover:text-amber-700 hover:border-amber-300 transition-all duration-200 ${
          canScrollLeft
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll left"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {children}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll('right')}
        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 flex items-center justify-center bg-white border border-warm-200 rounded-full shadow-soft text-warm-700 hover:text-amber-700 hover:border-amber-300 transition-all duration-200 ${
          canScrollRight
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll right"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  )
}
