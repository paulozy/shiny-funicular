interface MFIconProps {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
}

export function MFIcon({
  name,
  size = 16,
  color = 'currentColor',
  strokeWidth = 1.6,
}: MFIconProps) {
  const p = {
    stroke: color,
    strokeWidth,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  const s = {
    width: size,
    height: size,
    style: { display: 'block', flexShrink: 0 },
  }

  switch (name) {
    case 'home':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M3 10L10 3L17 10V17H13V12H7V17H3V10Z" />
        </svg>
      )
    case 'code':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M7 6L3 10L7 14M13 6L17 10L13 14M11 4L9 16" />
        </svg>
      )
    case 'branch':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <circle {...p} cx="5" cy="4" r="2" />
          <circle {...p} cx="5" cy="16" r="2" />
          <circle {...p} cx="15" cy="10" r="2" />
          <path {...p} d="M5 6V14M5 10C5 10 9 10 13 10" />
        </svg>
      )
    case 'box':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M3 6L10 3L17 6V14L10 17L3 14V6ZM3 6L10 9L17 6M10 9V17" />
        </svg>
      )
    case 'star':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M10 2L12.5 7.5L18 8.3L14 12.3L15 18L10 15L5 18L6 12.3L2 8.3L7.5 7.5Z" />
        </svg>
      )
    case 'rocket':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M11 3C14 4 16 7 17 10L13 14L10 11L11 3ZM10 11L7 14L4 13L7 10L10 11ZM7 14V17L11 15" />
        </svg>
      )
    case 'graph':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <circle {...p} cx="4" cy="6" r="2" />
          <circle {...p} cx="16" cy="6" r="2" />
          <circle {...p} cx="10" cy="15" r="2" />
          <path {...p} d="M5.5 7.5L8.5 13.5M11.5 13.5L14.5 7.5M6 6H14" />
        </svg>
      )
    case 'doc':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M5 2H12L16 6V18H5V2ZM12 2V6H16M8 10H13M8 13H13M8 16H11" />
        </svg>
      )
    case 'search':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <circle {...p} cx="9" cy="9" r="6" />
          <path {...p} d="M13.5 13.5L17 17" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M10 4V16M4 10H16" />
        </svg>
      )
    case 'check':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M4 10L8 14L16 5" />
        </svg>
      )
    case 'x':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M5 5L15 15M15 5L5 15" />
        </svg>
      )
    case 'chevron-right':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M8 5L13 10L8 15" />
        </svg>
      )
    case 'chevron-down':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M5 8L10 13L15 8" />
        </svg>
      )
    case 'arrow-right':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M4 10H16M11 5L16 10L11 15" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M5 14V8C5 5 7 3 10 3C13 3 15 5 15 8V14L17 16H3L5 14ZM8 17C8 18 9 18.5 10 18.5C11 18.5 12 18 12 17" />
        </svg>
      )
    case 'gear':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <circle {...p} cx="10" cy="10" r="3" />
          <path {...p} d="M10 2V5M10 15V18M2 10H5M15 10H18M4.5 4.5L6.5 6.5M13.5 13.5L15.5 15.5M15.5 4.5L13.5 6.5M4.5 15.5L6.5 13.5" />
        </svg>
      )
    case 'play':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M5 3L16 10L5 17V3Z" />
        </svg>
      )
    case 'pr':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <circle {...p} cx="5" cy="4" r="2" />
          <circle {...p} cx="5" cy="16" r="2" />
          <circle {...p} cx="15" cy="16" r="2" />
          <path {...p} d="M5 6V14M15 14V8C15 6 13 5 11 5H9M9 5L11 3M9 5L11 7" />
        </svg>
      )
    case 'commit':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <circle {...p} cx="10" cy="10" r="3" />
          <path {...p} d="M10 3V7M10 13V17" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M10 2L17 5V10C17 14 14 17 10 18C6 17 3 14 3 10V5L10 2Z" />
        </svg>
      )
    case 'sparkles':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M8 2L9 6L13 7L9 8L8 12L7 8L3 7L7 6Z" />
          <path {...p} d="M14 11L14.5 13L16.5 13.5L14.5 14L14 16L13.5 14L11.5 13.5L13.5 13Z" />
        </svg>
      )
    case 'folder':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M2 6V15C2 16 3 17 4 17H16C17 17 18 16 18 15V8C18 7 17 6 16 6H10L8 4H4C3 4 2 5 2 6Z" />
        </svg>
      )
    case 'database':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <ellipse {...p} cx="10" cy="5" rx="6" ry="2" />
          <path {...p} d="M4 5V15C4 16 7 17 10 17C13 17 16 16 16 15V5M4 10C4 11 7 12 10 12C13 12 16 11 16 10" />
        </svg>
      )
    case 'flag':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M5 17V3M5 4H14L12 7L14 10H5" />
        </svg>
      )
    case 'user':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <circle {...p} cx="10" cy="7" r="3" />
          <path {...p} d="M3 17C3 13 6 11 10 11C14 11 17 13 17 17" />
        </svg>
      )
    case 'lightbulb':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M7 13C5.5 12 5 10.5 5 9C5 6 7 4 10 4C13 4 15 6 15 9C15 10.5 14.5 12 13 13V15H7V13ZM8 18H12" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <rect {...p} x="4" y="9" width="12" height="9" rx="1" />
          <path {...p} d="M7 9V6C7 4.5 8.5 3 10 3C11.5 3 13 4.5 13 6V9" />
        </svg>
      )
    case 'send':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M3 17L17 10L3 3L5 10L3 17ZM5 10H17" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M3 6H17M3 10H17M3 14H17" />
        </svg>
      )
    case 'more':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <circle cx="5" cy="10" r="1.4" fill={color} />
          <circle cx="10" cy="10" r="1.4" fill={color} />
          <circle cx="15" cy="10" r="1.4" fill={color} />
        </svg>
      )
    case 'trophy':
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path {...p} d="M6 4H14V8C14 10 12 12 10 12C8 12 6 10 6 8V4ZM6 5H3V7C3 8 4 9 6 9M14 5H17V7C17 8 16 9 14 9M10 12V15M7 17H13" />
        </svg>
      )
    default:
      return <svg {...s} />
  }
}

interface AISparkProps {
  size?: number
  color?: string
}

export function AISpark({ size = 14, color = '#7a4cc8' }: AISparkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5L9.2 5.8L13.5 7L9.2 8.2L8 12.5L6.8 8.2L2.5 7L6.8 5.8Z"
        fill={color}
      />
      <circle cx="13" cy="3" r="1.2" fill={color} opacity="0.7" />
    </svg>
  )
}
