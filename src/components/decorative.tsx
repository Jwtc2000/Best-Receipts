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

// A single small paper-airplane silhouette, reused at different sizes,
// rotations, and flight paths by HeaderPlanes below.
function PlaneGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2 12 22 4 14 22 11 14 2 12Z" />
    </svg>
  )
}

// A few sparse paper airplanes drifting across the gradient header — one
// per direction (left-to-right, right-to-left, and a steeper diagonal) —
// on top of the brand gradient, never more than one or two visible at once.
export function HeaderPlanes() {
  return (
    <div className="topbar-planes" aria-hidden="true">
      <span className="topbar-plane topbar-plane-a">
        <PlaneGlyph />
      </span>
      <span className="topbar-plane topbar-plane-b">
        <PlaneGlyph />
      </span>
      <span className="topbar-plane topbar-plane-c">
        <PlaneGlyph />
      </span>
    </div>
  )
}
