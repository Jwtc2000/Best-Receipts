import type { ReactNode } from 'react'

export default function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="drawer-subsection">
      <h3>{title}</h3>
      {children}
    </section>
  )
}
