import React, { CSSProperties } from 'react'
import { Button } from '../ui/Button'

interface OAuthButtonProps {
  provider: 'github' | 'gitlab'
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 . 405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.016 12.016 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function GitLabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.955 13.587l-1.387-4.272a.922.922 0 00-.878-.593.932.932 0 00-.872.591L19.417 13.587h-3.625l-2.168-6.676a.924.924 0 00-.872-.592.924.924 0 00-.872.592L9.742 13.587H6.117L4.73 9.315a.922.922 0 00-.878-.593.922.922 0 00-.872.591L1.045 13.587a1.388 1.388 0 00.503 1.551l10.452 7.591 10.452-7.591a1.388 1.388 0 00.503-1.551z" />
    </svg>
  )
}

export function OAuthButton({ provider, onClick, disabled, loading }: OAuthButtonProps) {
  const label = provider === 'github' ? 'Continuar com GitHub' : 'Continuar com GitLab'
  const icon = provider === 'github' ? <GitHubIcon /> : <GitLabIcon />

  const buttonStyle: CSSProperties = {
    width: '100%',
    marginBottom: '10px',
  }

  return (
    <Button
      variant="default"
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      style={buttonStyle}
    >
      {icon}
      {label}
    </Button>
  )
}
