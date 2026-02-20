type Props = { onToggleTheme: () => void }

export default function Header({ onToggleTheme }: Props) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-canvas/70 border-b border-black/5">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" className="size-6" alt="Logo" />
          <span className="font-semibold tracking-tight">Project X</span>
        </div>
        <nav className="hidden md:flex items-center gap-3">
          <a className="btn btn-ghost" href="#features">Features</a>
          <a className="btn btn-ghost" href="#showcase">Showcase</a>
          <a className="btn btn-ghost" href="#contact">Contact</a>
        </nav>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={onToggleTheme}>
            Toggle Theme
          </button>
        </div>
      </div>
    </header>
  )
}
