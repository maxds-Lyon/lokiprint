#import "@preview/splash:0.3.0": tailwind

#let title(
  profile: (
    name: "name",
    title: "title",
    tagline: "tagline",
  ),
) = {
  let body = [
    #grid(
      gutter: 16pt,
      [ == #profile.title ],
      [ = #text(weight: "black", upper(profile.name)) ],
      [ #profile.tagline ]
    )
  ]
  let image = style(styles => {
    let size = measure(body, styles)
    image(height: size.height + 2pt, "./logo/maxds-logo.svg")
  })

  block(
    width: 100%,
    grid(
      column-gutter: 20pt,
      columns: (auto, 1fr),
      image, body,
    ),
  )
}