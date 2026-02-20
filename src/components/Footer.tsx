export default function Footer() {
  return (
    <footer className="border-t border-black/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-sm text-subtle">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Project X. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-ink">Privacy</a>
            <a href="#" className="hover:text-ink">Terms</a>
            <a href="#" className="hover:text-ink">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
