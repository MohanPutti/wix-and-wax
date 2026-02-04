import { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export default function StatsCard({ title, value, icon, trend, className = '' }: StatsCardProps) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-soft ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-warm-500 text-sm mb-1">{title}</p>
          <p className="font-serif text-3xl font-bold text-warm-900">{value}</p>
          {trend && (
            <p
              className={`text-sm mt-2 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-warm-400 ml-1">vs last month</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-amber-100 rounded-lg text-amber-600">{icon}</div>
        )}
      </div>
    </div>
  )
}
