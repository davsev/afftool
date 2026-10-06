import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopyButton } from '@/components/CopyButton'

describe('CopyButton', () => {
  it('copies text, confirms, and reports the copy', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')
    const onCopied = vi.fn()
    render(<CopyButton text="hello prompt" onCopied={onCopied} label="Copy prompt" />)
    await user.click(screen.getByRole('button', { name: /copy prompt/i }))
    expect(writeText).toHaveBeenCalledWith('hello prompt')
    expect(await screen.findByText(/copied/i)).toBeInTheDocument()
    expect(onCopied).toHaveBeenCalledOnce()
  })
})
