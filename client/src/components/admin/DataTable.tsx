import { ReactNode } from 'react'
import Spinner from '../ui/Spinner'

interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => ReactNode)
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No data found',
  keyExtractor,
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-soft overflow-hidden">
      <table className="w-full">
        <thead className="bg-warm-50 border-b border-warm-200">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className={`text-left px-6 py-4 text-sm font-semibold text-warm-700 ${
                  col.className || ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-warm-100 hover:bg-warm-50 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={`px-6 py-4 ${col.className || ''}`}>
                  {typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : (row[col.accessor] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-warm-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  )
}
