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

// A solid coffee cup silhouette representing food/meals.
function FoodGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5 8v6c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4V8H5zm12 2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1v-5zM2 20h16a1 1 0 1 1 0-2H2a1 1 0 1 1 0-2z" />
    </svg>
  )
}

// A solid jerrycan/gas can silhouette representing gasoline/transport.
function GasGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M8 2h8v3h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V2zm2 3h4V4h-4v1zm-4 4v11h12V9H6zm7 2h-2v3H8v2h3v3h2v-3h3v-2h-3v-3z" />
    </svg>
  )
}

// A solid car silhouette representing auto/transport.
function CarGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M19 10h-1.7L15.9 7.2A2 2 0 0 0 14.2 6H9.8a2 2 0 0 0-1.7 1.2L6.7 10H5a3 3 0 0 0-3 3v3h1.1a3 3 0 0 0 5.8 0h6.2a3 3 0 0 0 5.8 0H22v-3a3 3 0 0 0-3-3z M7 17.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z M17 17.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
    </svg>
  )
}

// A solid bed silhouette representing hotels/lodging.
function HotelGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M3 4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v7h12V7a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-2H6v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z M6 12h12v3H6v-3z M8 8h3v2H8V8z" />
    </svg>
  )
}

// A varied mix of paper airplanes, food, gas cans, cars, and hotel icons
// drifting across the gradient header on top of the brand gradient.
export function HeaderPlanes() {
  return (
    <div className="topbar-planes" aria-hidden="true">
      <span className="topbar-plane topbar-plane-a">
        <PlaneGlyph />
      </span>
      <span className="topbar-plane topbar-plane-b">
        <FoodGlyph />
      </span>
      <span className="topbar-plane topbar-plane-c">
        <GasGlyph />
      </span>
      <span className="topbar-plane topbar-plane-d">
        <CarGlyph />
      </span>
      <span className="topbar-plane topbar-plane-e">
        <HotelGlyph />
      </span>
      <span className="topbar-plane topbar-plane-f">
        <PlaneGlyph />
      </span>
      <span className="topbar-plane topbar-plane-g">
        <FoodGlyph />
      </span>
      <span className="topbar-plane topbar-plane-h">
        <CarGlyph />
      </span>
    </div>
  )
}
