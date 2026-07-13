import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AdminPlaceholderPage } from '@/components/admin/AdminPlaceholderPage'

describe('AdminPlaceholderPage', () => {
  it('renders the provided title and description', () => {
    render(
      <AdminPlaceholderPage
        title="Product Management"
        description="Manage your storefront products here."
      />
    )

    expect(screen.getByText('Product Management')).toBeTruthy()
    expect(screen.getByText('Manage your storefront products here.')).toBeTruthy()
  })
})
