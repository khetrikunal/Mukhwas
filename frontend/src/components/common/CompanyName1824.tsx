import type { ReactNode } from 'react'

export default function CompanyName1824({
  className,
}: {
  className?: string
}): ReactNode {
  return (
    <span className={className}>
      <span className="text-[0.75em] align-baseline font-medium">1824</span>{' '}
      <span className="align-baseline">Vituraya Ventures Private Limited</span>
    </span>
  )
}
