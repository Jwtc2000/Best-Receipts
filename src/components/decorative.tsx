import Icon from './icons'

// A rightward-arrow section divider, built from the app's own express-arrow
// glyph — used to break up multi-section drawer menus.
export function ArrowDivider() {
  return (
    <div className="drawer-arrow-divider" aria-hidden="true">
      <span className="drawer-arrow-divider-line" />
      <span className="drawer-arrow-icon">
        <Icon name="express-arrow" size={16} />
      </span>
      <span className="drawer-arrow-divider-line" />
    </div>
  )
}

// A sparse node-link graphic (receipt → report → PDF, as a graph) layered
// behind the header title/buttons, on top of the brand gradient. White-only
// so it reads against both the purple and orange ends of the gradient.
export function HeaderNodeArt() {
  return (
    <svg
      className="topbar-node-art"
      viewBox="0 0 360 56"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="40" y1="16" x2="150" y2="10" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.5" />
      <line x1="40" y1="16" x2="140" y2="42" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.5" />
      <line x1="150" y1="10" x2="250" y2="24" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.5" />
      <line x1="140" y1="42" x2="250" y2="24" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.5" />
      <line x1="250" y1="24" x2="330" y2="14" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.5" />
      <circle cx="40" cy="16" r="3" fill="#fff" fillOpacity="0.3" />
      <circle cx="150" cy="10" r="2.5" fill="#fff" fillOpacity="0.25" />
      <circle cx="140" cy="42" r="2.5" fill="#fff" fillOpacity="0.25" />
      <circle cx="250" cy="24" r="3.5" fill="#fff" fillOpacity="0.32" />
      <circle cx="330" cy="14" r="2.5" fill="#fff" fillOpacity="0.25" />
    </svg>
  )
}
