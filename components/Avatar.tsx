/* eslint-disable @next/next/no-img-element */
export function Avatar({ url, name, size = 24 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    return <img src={url} alt="" width={size} height={size} className="rounded-full border border-line" />
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      className="inline-grid place-items-center rounded-full border border-line bg-raised font-medium uppercase text-muted"
    >
      {name.slice(0, 1)}
    </span>
  )
}
