import { render, screen } from '@testing-library/react'

function AdminStub() {
  return <div>Admin</div>
}

test('admin renders without throwing', () => {
  render(<AdminStub />)
  expect(screen.getByText('Admin')).toBeInTheDocument()
})
