#let size-scale(base: 12pt, ratio: 1.1) = (
  small: base * calc.pow(ratio, -1),
  p:     base * calc.pow(ratio, 0),
  h6:    base * calc.pow(ratio, 1),
  h5:    base * calc.pow(ratio, 2),
  h4:    base * calc.pow(ratio, 3),
  h3:    base * calc.pow(ratio, 4),
  h2:    base * calc.pow(ratio, 5),
  h1:    base * calc.pow(ratio, 6),
)

#let minor-second-scale   = size-scale.with(ratio: 1.1)
#let major-second-scale   = size-scale.with(ratio: 1.15)
#let minor-third-scale    = size-scale.with(ratio: 1.200)
#let major-third-scale    = size-scale.with(ratio: 1.250)
#let perfect-fourth-scale = size-scale.with(ratio: 1.35)

#let scale = major-second-scale(base: 12pt)