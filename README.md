# A Gathering Storm: The Regime of the Cloud

An interactive research environment on cloud computing, extraction and digital sovereignty, seen from Brazil.

**Live site:** https://lll-uuu.github.io/gathering-storm/

![A sky of glowing asterisks over magenta clouds](assets/img/screenshot.png)

## About

*The Regime of the Cloud* is a techno-social amalgamate of tools, infrastructures, devices and ways of doing that produces harm to all forms of life. This site gathers the research around it as a sky to wander through. Each star opens a piece of the research: essays and stories, field notes, sound and image, a reading list, and the research strands themselves.

The research takes three forms:

- **Spellbreak Training:** a peer-to-peer method that helps small organizations reduce their dependence on big-tech cloud services. The full training manual is on the site.
- **A community research report:** short interviews and publications.
- **Field research in Rio de Janeiro:** minerals (niobium, silica sand), data centers, the PIX payment system, and digital sovereignty.

The **Project Map** star opens an interactive map of how these strands connect.

## How to use the site

- Drag to look around the sky, and hover over a star to see its title.
- Click a star to open it. To close a window, click outside it, click the × button, or press Escape.
- The legend in the bottom-left corner shows each kind of content. Hover over a category to highlight its stars.

| Star color | Content |
| --- | --- |
| Cyan | Essays and stories |
| Lime, with a halo | Research |
| Yellow, with a halo | Reading list |
| Orange | Field notes and news |
| White | Sound and image |

## Context and credits

Developed in 2025 as part of the Community Research track at [TITiPI, the Institute for Technology in the Public Interest](https://titipi.org), within the CHANSE-funded research project [SoLiXG (The Social Life of XG)](https://solixg.net/), with Helen V Pritchard.

- **Research, writing, design and code:** Luiza Prado
- **Spellbreak Training:** written by Luiza Prado featuring Femke Snelting, developed with Ailie Rutherford (Market Gallery and the Feminist Exchange Network). Thanks to Gwendolin Barnard, Constant (Imane Benyecif), and Dilan ᛞ for Bewitching Technologies.

## Built with

- Plain HTML, CSS and JavaScript (ES modules), with no build step
- [Three.js](https://threejs.org/) r134 for the stars
- [Vanta.js](https://www.vantajs.com/) for the clouds
- Typefaces: Velvelyne and FT88

The code was written by hand. AI tools were used to catch errors.

## Run it locally

The site loads its content with `fetch`, so it needs a small local web server. Opening `index.html` directly in a browser will not work.

```
cd gathering-storm
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Add or change content

All stars are listed in `hotspots.json`. Each entry looks like this:

```json
{
  "id": "my-new-star",
  "title": "Title shown on hover and in the window",
  "type": "text",
  "src": "assets/my-text.html",
  "category": "writing",
  "size": 2.0
}
```

- `type`: `text` (an HTML file in `assets/`), `link` (needs `url`, and optionally `excerpt`), `video`, `audio` or `image`
- `category`: `writing`, `research`, `reading`, `news` or `media`
- `size`: how large the star appears

To split a long text into pages, wrap each part in `<section data-page="1" data-title="Page title">`.

## Structure

```
index.html          page shell
hotspots.json       list of all stars
css/styles.css      all styling
js/app/             scene, layout, windows, project map
assets/             texts, images, fonts
```

## License

- **Code:** MIT License
- **Spellbreak Training manual:** Collective Conditions for Re-Use ([cc2r](https://gitlab.constantvzw.org/cc2r/v1.0))
- **Other texts and images by Luiza Prado:** Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)
- **Third-party material** (quoted passages, linked articles, typefaces, libraries) remains under its owners' terms.

See [LICENSE](LICENSE) for details.
