import { render } from '@testing-library/react'
import { vi } from 'vitest'
import Home from '../app/page'

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

test('home page renders without throwing', () => {
  expect(() => render(<Home />)).not.toThrow()
})
