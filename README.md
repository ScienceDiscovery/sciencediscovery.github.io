# ScienceDiscovery website

The public website at <https://sciencediscovery.github.io/> has an interactive product demo, the bilingual user documentation with full-text search, a deployment guide, and downloads.

| Page | Source |
|---|---|
| Home (interactive demo, features, screenshots) | `site/build.mjs`, `site/src/demo.js`, `site/src/viz.js` |
| Documentation (with search) | rendered from `docs/en` and `docs/zh` |
| Deployment (binary, Docker, source) | `site/build.mjs` (`D` strings) |
| Download (Linux today, Windows/macOS ready) | `release.json` |

English is at the root and Chinese under `/zh/`. Light and dark themes follow the system setting and can be toggled from the top bar.

## Develop and preview

Use Node.js 22.19 or later:

```sh
npm ci
npm run build   # builds dist/ and validates links, anchors, images and the synced docs
npm run serve   # http://127.0.0.1:4173/ (refuses to pick another port)
```

`npm run dev` rebuilds and then serves. There is no runtime dependency on a CDN or an API.

### Interactive demo

`site/src/demo.js` replays seven scripted sessions in a replica of the product shell: literature survey, Idea Tree, Evolve, memory graph, protein pocket, crystal structure and differential expression. `site/src/viz.js` contains a small canvas 3D renderer (protein ribbon and ligand, perovskite supercell with octahedra) and the SVG plots (volcano, heatmap, XRD). All structures and data are generated locally and are illustrative, not experimental results.

### Search

The build writes `search-index.json` (English) and `zh/search-index.json` from the rendered documentation, split by heading. `site/src/site.js` loads it on first use and ranks results in the browser. Open it with the top-bar button, `Ctrl/⌘ K`, or `/`.

## Documentation source

`docs/README.md`, `docs/en/`, `docs/zh/`, `docs/architecture/`, `docs/images/`, and `LICENSE` are copied from the [product repository](https://gitcode.com/openJiuwen/sciencediscovery). `docs-source.json` records the source revision and each copied file's SHA256. Copied pages keep their original Markdown, screenshots, and directory structure. Links that leave the docs tree become links into the [GitHub product repository](https://github.com/openJiuwen-ai/sciencediscovery). A page that exists in only one language is shown in the other with a notice.

To refresh from a clean product checkout:

```sh
npm run sync:docs -- ../sciencediscovery
npm run build
```

The script only reads the source checkout, replaces the files recorded in the manifest, and removes obsolete synced files. Make documentation edits upstream first, then sync. Everything is committed together on `main`; deployments never fetch documentation from another repository.

The website owns `site/`, `scripts/`, `release.json`, `docs-source.json`, and the workflow. To feature a page in the documentation sidebar, add it to `NAV` in `site/build.mjs`; every other page appears automatically under “All documents”.

## Downloads

`release.json` pins the binaries to [0.2.0](https://github.com/openJiuwen-ai/sciencediscovery/releases/tag/0.2.0), with the SHA256 published by the GitHub Release API. When Windows or macOS builds are released, add entries with a matching `name` (or an explicit `"os"`), a `url`, and `sha256`; the download page moves them out of the “not published yet” state automatically. Product documentation is a snapshot of the main branch and can describe changes after that release.

## Publishing

`pages.yml` builds from `main` and deploys the artifact with GitHub Pages. Select **GitHub Actions** as the Pages source. Pull requests run the build and link checks without deploying.

## License

[Apache License 2.0](LICENSE). The original license is retained with the copied product documentation.
