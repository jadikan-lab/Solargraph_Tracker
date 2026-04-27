import React from 'react'

/* ─── Icons ─── */
const Ico = ({ d, size = 18, stroke = 1.6, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>{d}</svg>
)
export const IconPin    = (p) => <Ico {...p} d={<><path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></>}/>
export const IconList   = (p) => <Ico {...p} d={<path d="M4 6h16M4 12h16M4 18h10"/>}/>
export const IconMap    = (p) => <Ico {...p} d={<><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></>}/>
export const IconGear   = (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.4.6 1 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>}/>
export const IconPlus   = (p) => <Ico {...p} d={<path d="M12 5v14M5 12h14"/>}/>
export const IconCheck  = (p) => <Ico {...p} d={<path d="m4 12 5 5L20 6"/>}/>
export const IconArrowL = (p) => <Ico {...p} d={<path d="M19 12H5m6-6-6 6 6 6"/>}/>
export const IconArrowR = (p) => <Ico {...p} d={<path d="M5 12h14m-6-6 6 6-6 6"/>}/>
export const IconMore   = (p) => <Ico {...p} d={<><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></>}/>
export const IconTrash  = (p) => <Ico {...p} d={<><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></>}/>
export const IconEdit   = (p) => <Ico {...p} d={<><path d="M14 4l6 6-11 11H3v-6L14 4Z"/><path d="M13 5l6 6"/></>}/>
export const IconCamera = (p) => <Ico {...p} d={<><path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="4"/></>}/>
export const IconCloud  = (p) => <Ico {...p} d={<path d="M7 18h11a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.1 11.5 4 4 0 0 0 7 18z"/>}/>
export const IconCloudOff= (p)=> <Ico {...p} d={<><path d="M3 3l18 18"/><path d="M7 18h11a4 4 0 0 0 1.5-7.7"/><path d="M6.1 11.5A4 4 0 0 0 7 18"/><path d="M9 6.5A6 6 0 0 1 18.6 10"/></>}/>
export const IconWifiOff= (p) => <Ico {...p} d={<><path d="M3 3l18 18"/><path d="M5 12.5a11 11 0 0 1 4-2.4"/><path d="M2 8.8a16 16 0 0 1 6-3.4"/><path d="M19 12.5a11 11 0 0 0-4-2.4"/><circle cx="12" cy="18" r="1.2" fill="currentColor"/></>}/>
export const IconChev   = (p) => <Ico {...p} d={<path d="m6 9 6 6 6-6"/>}/>
export const IconLocate = (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></>}/>
export const IconSun    = (p) => <Ico {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>}/>
export const IconRefresh= (p) => <Ico {...p} d={<><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/></>}/>

/* ─── Btn ─── */
export function Btn({ kind = 'primary', size, block, icon, iconRight, children, className = '', ...rest }) {
  const cls = ['btn', 'btn-' + kind, size && 'btn-' + size, block && 'btn-block', className].filter(Boolean).join(' ')
  return <button className={cls} {...rest}>{icon}<span>{children}</span>{iconRight}</button>
}

/* ─── Chip ─── */
export function Chip({ children, active, muted, status, onRemove, icon, className = '', ...rest }) {
  const cls = ['chip', active && 'active', muted && 'muted', status && 'status-' + status, className].filter(Boolean).join(' ')
  return (
    <span className={cls} {...rest}>
      {icon}{children}
      {onRemove && (
        <button onClick={onRemove} aria-label="retirer" style={{ background: 'transparent', border: 0, padding: 0, marginLeft: 2, cursor: 'pointer', color: 'inherit', opacity: 0.6, display: 'flex' }}>
          <Ico size={12} d={<><path d="M5 5l10 10M15 5l-10 10"/></>}/>
        </button>
      )}
    </span>
  )
}

/* ─── Card ─── */
export function Card({ children, flat, raised, className = '', ...rest }) {
  return <div className={['card', flat && 'flat', raised && 'raised', className].filter(Boolean).join(' ')} {...rest}>{children}</div>
}

/* ─── Segmented ─── */
export function Segmented({ value, onChange, items, className = '' }) {
  return (
    <div className={'segmented ' + className}>
      {items.map((it) => (
        <button key={it.value} className={value === it.value ? 'active' : ''} onClick={() => onChange?.(it.value)}>
          {it.dot && <span className="dot" style={{ background: it.dot }}/>}
          <span>{it.label}</span>
          {it.count != null && <span className="count">({it.count})</span>}
        </button>
      ))}
    </div>
  )
}

/* ─── StatusPill ─── */
export function StatusPill({ status = 'enplace', size, children, className = '' }) {
  const label = children ?? (status === 'enplace' ? 'en place' : 'récupéré')
  return (
    <span className={['statuspill', status, size === 'lg' && 'lg', className].filter(Boolean).join(' ')}>
      <span className="dot"/>{label}
    </span>
  )
}

/* ─── ScreenTitle ─── */
export function ScreenTitle({ children, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
      <div>
        <div className="screen-title">{children}</div>
        {sub && <div className="screen-sub">{sub}</div>}
      </div>
      {right}
    </div>
  )
}

/* ─── Field ─── */
export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={'field ' + className}>
      <div className="field-label">{label}</div>
      {children}
      {hint && <div style={{ fontSize: 12, color: 'var(--encre-mute)', marginTop: 6 }}>{hint}</div>}
    </label>
  )
}

/* ─── ActionBar ─── */
export function ActionBar({ children, sticky = true }) {
  return <div className="actionbar" style={!sticky ? { position: 'static', borderTop: 0, background: 'transparent', padding: '8px 0 16px' } : undefined}>{children}</div>
}

/* ─── Toast ─── */
export function Toast({ kind = 'success', children, onClose }) {
  React.useEffect(() => { if (onClose) { const t = setTimeout(onClose, 2800); return () => clearTimeout(t) } }, [onClose])
  return (
    <div className={'toast ' + (kind !== 'success' ? kind : '')}>
      <span className="ico">{kind === 'error' ? <IconCloudOff size={14}/> : <IconCheck size={14}/>}</span>
      {children}
    </div>
  )
}

/* ─── StatusHero (Drive) ─── */
export function StatusHero({ state = 'ok', sub, onAction, actionLabel }) {
  const skins = {
    ok:      { bg: '#fbe6a6', border: '#e2b53b', color: '#5a4406', icon: <IconCloud size={20}/>,    title: 'Tout est synchronisé', emoji: '✓' },
    syncing: { bg: '#fbe6a6', border: '#e2b53b', color: '#5a4406', icon: <IconRefresh size={20}/>,  title: 'Synchronisation…',     emoji: '' },
    expired: { bg: '#f3d2c8', border: '#c8553d', color: '#6b2415', icon: <IconCloudOff size={20}/>, title: 'Drive expiré',         emoji: '' },
    offline: { bg: 'var(--papier-2)', border: 'var(--papier-edge)', color: 'var(--encre)', icon: <IconWifiOff size={20}/>, title: 'Hors ligne', emoji: '' },
  }
  const s = skins[state]
  return (
    <div style={{ borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, background: s.bg, border: '1px solid ' + s.border, color: s.color }}>
      <div style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.55)', border: '1px solid ' + s.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, lineHeight: 1.2 }}>{s.title} {s.emoji && <span style={{ fontWeight: 700 }}>{s.emoji}</span>}</div>
        <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>{sub || 'il y a 2 min · Wi-Fi'}</div>
      </div>
      {onAction && <button onClick={onAction} style={{ height: 36, padding: '0 12px', borderRadius: 999, background: 'var(--papier)', border: '1px solid ' + s.border, color: s.color, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{actionLabel}</button>}
    </div>
  )
}

/* ─── Tab bar ─── */
export function TabBar({ active, onTab, onAdd }) {
  const tab = (id, icon, label) => (
    <button key={id} className={active === id ? 'active' : ''} onClick={() => onTab?.(id)}>
      <span className="ico">{icon}</span>{label}
    </button>
  )
  return (
    <nav className="tabbar">
      {tab('liste',   <IconList size={20}/>, 'Liste')}
      <div className="fab-slot">
        <button className="fab" onClick={() => (onAdd || onTab)?.('ajouter')} aria-label="Ajouter un sténopé">
          <IconPlus size={28} stroke={2}/>
        </button>
      </div>
      {tab('carte',    <IconMap size={20}/>, 'Carte')}
      {tab('reglages', <IconGear size={20}/>,'Réglages')}
    </nav>
  )
}

/* ─── Stat tile ─── */
export function Stat({ value, unit, label }) {
  return (
    <div className="stat">
      <div className="v">{value}{unit && <small>{unit}</small>}</div>
      <div className="l">{label}</div>
    </div>
  )
}

/* ─── PhotoPlaceholder ─── */
export function PhotoPlaceholder({ aspect = '4 / 3', label = 'photo · 16:9', style, className = '' }) {
  return <div className={'photo-ph ' + className} style={{ aspectRatio: aspect, width: '100%', ...style }}>{label}</div>
}

/* ─── Helpers ─── */
export function daysSince(ts) {
  if (!ts) return 0
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24))
}
export function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
