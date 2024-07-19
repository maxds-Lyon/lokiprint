#import "@preview/fontawesome:0.1.0": *
#import "@preview/splash:0.3.0": tailwind

#let presentation-section( presentation ) = block(
)[
  #presentation
  #set par(linebreaks: "simple")
]

#let links-section( links ) = block(
)[
  #stack(
    dir: ltr,
    spacing: 6pt,

    ..links.map(el => link(
        el.url,
        block(
          inset: 6pt,
          fill: tailwind.slate-100,
          radius: 2pt,
          grid(
            columns: (18pt, auto),
            fa-icon(el.icon, fa-set: "Brands"),
            box(el.text)
          )
      )
    ))
  )
]