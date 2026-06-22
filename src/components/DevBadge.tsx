export default function DevBadge() {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '9px',
      fontWeight: 600,
      color: 'var(--color-gold)',
      background: 'rgba(212, 175, 55, 0.12)',
      border: '1px solid rgba(212, 175, 55, 0.35)',
      borderRadius: '3px',
      padding: '1px 5px',
      letterSpacing: '0.06em',
      flexShrink: 0,
    }}>
      DEV
    </span>
  )
}
