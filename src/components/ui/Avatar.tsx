import { T } from '@/lib/tokens'

const AVATAR_COLORS = ['#d97757', '#7a4cc8', '#3a8c5a', '#3970bf', '#bf6940', '#52789e']

interface AvatarProps {
  name?: string
  size?: number
}

/**
 * Initial-letter avatar with a colour derived from the name, so the same person
 * is always the same colour without storing anything. Extracted from AppShell
 * when the members table needed it too.
 */
export function Avatar({ name = 'M', size = 26 }: AvatarProps) {
  const idx = (name?.charCodeAt(0) || 77) % AVATAR_COLORS.length

  return (
    <div
      className="mf-avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: AVATAR_COLORS[idx],
        color: '#fff',
        fontSize: size * 0.42,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: 0,
        flexShrink: 0,
        fontFamily: T.font,
      }}
    >
      {(name || 'M').slice(0, 1).toUpperCase()}
    </div>
  )
}
