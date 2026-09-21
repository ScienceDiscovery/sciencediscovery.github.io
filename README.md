# ScienceDiscovery website

The public website at <https://sciencediscovery.github.io/> has an interactive product demo, the bilingual user documentation with full-text search, a deployment guide, and downloads.

| Page | Source |
|---|---|
| Home (interactive demo, features) | `site/build.mjs`, `site/src/demo.js`, `site/src/viz.js` |
| Documentation (with search) | rendered from the product repository's `docs/en` and `docs/zh` |
| Deployment (binary, Docker, source) | `site/build.mjs` (`D` strings) |
| Download (Linux today; macOS ready) | `release.json` |

English is at the root and Chinese under `/zh/`. Light and dark themes follow the system setting and can be toggled from the top bar.

## Develop and preview

Use Node.js 22.19 or later:

```sh
npm ci
npm run build   # fetches docs if needed, builds dist/, validates links, anchors and images
npm run serve   # http://127.0.0.1:4173/ (refuses to pick another port)
```

`npm run dev` rebuilds and then serves. There is no runtime dependency on a CDN or an API.

### Interactive demo

`site/src/demo.js` replays seven scripted sessions in a replica of the product shell: literature survey, Idea Tree, Evolve, memory graph, protein pocket, crystal structure and differential expression. `site/src/viz.js` contains a small canvas 3D renderer (protein ribbon and ligand, perovskite supercell with octahedra) and the SVG plots (volcano, heatmap, XRD). All structures and data are generated locally and are illustrative, not experimental results.

### Search

The build writes `search-index.json` (English) and `zh/search-index.json` from the rendered documentation, split by heading. `site/src/site.js` loads it on first use and ranks results in the browser. Open it with the top-bar button, `Ctrl/⌘ K`, or `/`.

## Documentation source

`docs/` is a committed symlink to `sciencediscovery/docs`, a shallow sparse checkout of the [product repository](https://github.com/openJiuwen-ai/sciencediscovery) (`main`). The website renders the product's own `docs/en`, `docs/zh` and `docs/images`; nothing is copied or pinned here, so edit documentation upstream only.

- Locally, `npm run build` clones the checkout when it is missing. Run `npm run fetch:docs` to fast-forward it to the latest `main`. The checkout is git-ignored.
- In CI, `pages.yml` checks the product repository out next to this one. It also runs every six hours, so upstream documentation changes reach the site without a commit here.
- Links that leave the docs tree become links into the product repository. A page that exists in only one language is shown in the other with a notice.

The website owns `site/`, `scripts/`, `release.json`, and the workflow. To feature a page in the documentation sidebar, add it to `NAV` in `site/build.mjs`; every other page appears automatically under “All documents”. Because the documentation is not pinned, a renamed upstream page can break a `NAV` entry or a link: `npm run build` fails on missing pages, links and anchors, so the scheduled deployment simply keeps the previous site until this repository is fixed.

## Downloads

`release.json` pins the binaries to [0.2.0](https://github.com/openJiuwen-ai/sciencediscovery/releases/tag/0.2.0), with the SHA256 published by the GitHub Release API. When Windows or macOS builds are released, add entries with a matching `name` (or an explicit `"os"`), a `url`, and `sha256`; the download page moves them out of the “not published yet” state automatically. Product documentation is a snapshot of the main branch and can describe changes after that release.

## Publishing

`pages.yml` builds from `main` and deploys the artifact with GitHub Pages. Select **GitHub Actions** as the Pages source. Pull requests run the build and link checks without deploying.

## License

[Apache License 2.0](LICENSE). The original license is retained with the copied product documentation.
