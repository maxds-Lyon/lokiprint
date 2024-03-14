#let education(content) = grid(
      columns: (auto, 1fr),
      gutter: 16pt,
      ..content.map(item => (align(right, item.dates), [
        #text(weight: "bold", item.name)

        #item.location
      ])).flatten()
    )
