#import "@preview/splash:0.3.0": tailwind
#import "./shared/sizes.typ": scale

#let page-background(
  borders: (top: 4pt),
  color: black,
) = block(
  width: 100%,
  height: 100%,
  inset: borders,
  fill: color,
  block(
    width: 100%,
    height: 100%,
    fill: white,
  ),
)

#let page-footer(
  background: white,
  height: 80pt,
  content: (
    header: "header",
    sub: "sub",
  ),
) = block(
  fill: background,
  height: height,
  width: 100%,
  clip: true,
  inset: (x: 32pt),
  align(
    horizon,
    grid(
      columns: (1fr, auto, auto),
      gutter: 12pt,
      align(bottom + left, text(weight: "semibold", content.header)),
      align(bottom + left, content.contact1.name),
      align(bottom + right, content.contact1.phone),

      align(bottom + left, text(size: scale.small, content.sub)),
      align(bottom + left, content.contact2.name),
      align(bottom + right, content.contact2.phone),
    ),
  ),
)