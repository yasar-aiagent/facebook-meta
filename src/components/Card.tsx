import { cn } from '@/lib/utils'

type Props = {
  title: string
  desc?: string
  className?: string
  cta?: { label: string, onClick?: () => void, href?: string }
}

export default function Card({ title, desc, className, cta }: Props) {
  return (
    <div className={cn('card', className)}>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {desc && <p className="mt-2 text-subtle">{desc}</p>}
      {cta && (
        <div className="mt-4">
          {cta.href ? (
            <a className="btn btn-primary" href={cta.href}>{cta.label}</a>
          ) : (
            <button className="btn btn-primary" onClick={cta.onClick}>{cta.label}</button>
          )}
        </div>
      )}
    </div>
  )
}
