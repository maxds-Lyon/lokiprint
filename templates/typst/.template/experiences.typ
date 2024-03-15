
#import "@preview/splash:0.3.0": tailwind
#import "@preview/cmarker:0.1.0"
#import "./shared/flex.typ": *

#let experience-block(
  content
) = block(
  inset: 24pt,
  radius: 16pt,
  fill: tailwind.slate-100,
)[
  #flex(
    gap: 24pt,
    [
      #flex(gap: 18pt)[
        #grid(
          column-gutter: 12pt,
          columns: (1fr, auto),
          text(fill: tailwind.orange-500)[=== #content.name],
          align(bottom, text(baseline: -1pt, if ("dates" in content) [#content.dates] else [""]))
        )
        #if ("title" in content) [
          #block(
            heading(level: 4, content.title)
          )
        ]
        #if ("description" in content) [
          #set par(justify: true, leading: 0.52em)
          #cmarker.render(content.description)
        ]
      ]

      #if ("work" in content) [
        #flex(gap: 18pt)[
          ==== Réalisations
          #for el in content.work [
            #flex(gap: 12pt)[
              #if ("title" in el) [
                ===== #el.title
              ]

              #cmarker.render(el.content)
            ]
          ]
        ]
      ]

      #if ("skills" in content) [
        #flex(
          direction: row,
          gap: 6pt,
          for el in content.skills {
            box(
              inset: 6pt,
              fill: white,
              radius: 2pt,
              el
            )

          }
        )
      ]
    ]
  )
]