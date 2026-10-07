import type { SVGProps } from 'react'

const PATHS = {
  sun: 'M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  monitor: 'M4 5h16v11H4zM9 20h6M12 16v4',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  reset: 'M4 4v6h6M4.5 14a8 8 0 1 0 2-8.5L4 10',
  alert: 'M12 3 2 20h20L12 3zm0 6v5m0 3v.5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-10v6m0-9v.5',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5H5V6h5',
  check: 'M5 12.5 10 17 19 7',
  x: 'M6 6l12 12M18 6 6 18',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3zM9 12l2 2 4-4',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4zM5 17a3 3 0 0 1 3-3h11',
  scale: 'M12 4v16M6 20h12M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7zm14 0-3 7a3 3 0 0 0 6 0l-3-7z',
  chart: 'M4 20V4m0 16h16M8 16v-5m4 5V8m4 8v-3',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1',
  users: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.4M15 4.2a3.5 3.5 0 0 1 0 6.6',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  chevron: 'M9 6l6 6-6 6',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  home: 'M4 11 12 4l8 7M6 10v10h12V10',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  hourglass: 'M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9',
  leaf: 'M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19c3-5 6-8 10-10',
  gem: 'M6 4h12l3 5-9 11L3 9l3-5zM3 9h18M9 4l-1 5 4 11M15 4l1 5-4 11',
  layers: 'M12 3 3 8l9 5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  coins: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v4c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 10v4c0 1.7 3.6 3 8 3s8-1.3 8-3v-4M4 14v4c0 1.7 3.6 3 8 3s8-1.3 8-3v-4',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  trendDown: 'M3 7l6 6 4-4 8 8M21 11v6h-6',
  ballot: 'M4 14h16v6H4zM7 14V8l5-4 5 4v6M9 17h6',
  scroll: 'M8 4h10a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H6a3 3 0 0 0 3-3V6a2 2 0 0 0-1-2zM8 4a2 2 0 0 0-2 2v1h3M12 9h5M12 13h5',
  quote: 'M7 7h4v4a4 4 0 0 1-4 4V7zM15 7h4v4a4 4 0 0 1-4 4V7z',
  ripple: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13',
} as const

export type IconName = keyof typeof PATHS
export type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & { name: IconName; size?: number; label?: string }

export function Icon({ name, size = 18, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
