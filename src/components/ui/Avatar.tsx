import { T } from '@/lib/tokens'

// Tinted from the v3 ramps (teal accent + clay secondary + supporting hues on
// the same lightness step) so a wall of avatars still reads as one palette.
const AVATAR_COLORS = ['#146b62', '#8a5a3c', '#1c7a4f', '#3a5f7a', '#6f5a8a', '#9a6a10']

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
