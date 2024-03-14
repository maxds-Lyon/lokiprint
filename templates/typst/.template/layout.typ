
#let presentation(contents) = [
  = #contents.profile.name

  #set text(weight: "light")
]

#let skills(contents) = [
  #set par(justify: false)
  == À propos

  #contents.presentation

  === Compétences

  #for skill in contents.skills [
    ==== #skill.title

    #for item in skill.items [
      - #item
    ]
  ]

]

#let experiences(contents) = [
  #import "@preview/cmarker:0.1.0"

  == Expériences

  #for experience in contents.experiences [
    === #experience.name

    #heading(level: 4, [
      #experience.title
      #h(12pt)
      #set text(size: 12pt, weight: "light")
      #experience.dates
    ])

    #experience.description

    ===== Technos

    #experience.skills.join(", ")

    ===== Réalisations

    #for work in experience.work [
      ====== #work.title

      #cmarker.render(work.content)
    ]
  ]
]
