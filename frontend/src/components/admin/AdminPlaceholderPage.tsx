import Link from 'next/link'

interface AdminPlaceholderPageProps {
  title: string
  description: string
  href?: string
}

export function AdminPlaceholderPage({ title, description, href = '/admin/dashboard' }: AdminPlaceholderPageProps) {
  return (
    <div className="ml-64 p-8">
      <div className="max-w-3xl rounded-2xl border border-navy/10 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Admin Area</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-navy">{title}</h1>
        <p className="mt-3 text-base text-gray-600">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={href} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy/90">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
