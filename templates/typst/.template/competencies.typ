#import "./shared/sizes.typ": scale
#import "./shared/flex.typ": flex
#import "@preview/splash:0.3.0": tailwind


#let competency-main-skills(
  list,
) = [
  #for skill in list [
    #box(
      radius: 16pt,
      inset: 6pt,
      fill: tailwind.slate-200,
      skill,
    )
  ]

]

#let competency-block(radius: 12pt, element) = block(width: 127pt)[
  #block(
    // fill: white,
    width: 100%,
    // radius: radius,
    inset: (top: 8pt),
    align(center + horizon)[
      #text(weight: "bold", size: scale.h6, element.name)
    ]
  )

  #block(inset: (x: 8pt), list(..element.items))
]

#let competency-grid(
  ..elements,
) = block(inset: (x: -16pt))[

  #style(styles => {
    let blocks = elements.pos().map(el => competency-block(el, radius: 4pt))

    let max-height = calc.max(..blocks.map(block => measure(block, styles).height))

    grid(
      columns: 4,
      gutter: 8pt,
      ..blocks.map(el => box(
        height: (max-height) + 20pt,
        radius: 8pt,
        inset: 4pt,
        fill: tailwind.slate-100,
        align(top, el),
      ))
    )
  })
]

#let create-block-description(name, id, content) = {
  if id in content {
    return ((name: name, items: content.at(id)))
  }

  return ()
}


#let competencies(content) = {
  // competency-main-skills(
  //   content.languages + content.frameworks
  // )
  let rows = content.map(item => (name: item.title, items: item.items)).fold(
    (),
    (acc, val) => {
      if (acc.len() == 0 or acc.last().len() == 4) {
        return (..acc, (val,))
      }

      return (..acc.slice(0, -1), (..acc.last(), val))
    },
  )

  flex(gap: 8pt)[
    #for row in rows {
      competency-grid(..row)
    }
  ]
}