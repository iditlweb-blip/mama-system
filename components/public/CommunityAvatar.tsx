// Author avatar for community questions/answers. Shows the poster's profile
// picture when available; otherwise a mauve circle with the default woman emoji
// (also used for anonymous posts).
export default function CommunityAvatar({ url, size = 32 }: { url?: string | null; size?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
        background: '#7F5268', color: '#fff', fontSize: size * 0.55, lineHeight: 1,
      }}
      aria-hidden="true"
    >
      {url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : '👩'}
    </span>
  )
}
