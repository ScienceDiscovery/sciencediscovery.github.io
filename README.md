# ScienceDiscovery website

The public website at <https://sciencediscovery.github.io/> opens with a product screen recording, then the four headline capabilities, the bilingual user documentation with full-text search, a deployment guide, and downloads.

| Page | Source |
|---|---|
| Home (screen recording, four capabilities) | `site/build.mjs`, `site/src/site.css`, `site/src/media/ScienceDiscovery.mp4` |
| Documentation (with search) | rendered from the product repository's `docs/en` and `docs/zh` |
| Install (binary, Docker, source) | `site/build.mjs` (`D` strings) |
| Linux release assets | `release.json` |

English is at the root and Chinese under `/zh/`. Light and dark themes follow the system setting and can be toggled from the top bar.

## Develop and preview

Use Node.js 22.19 or later:

```sh
npm ci
npm run build   # fetches docs if needed, builds dist/, validates links, anchors and images
npm run serve   # http://127.0.0.1:4173/ (refuses to pick another port)
```

`npm run dev` rebuilds and then serves. There is no runtime dependency on a CDN or an API.

### Homepage video

The recording sits in the middle of the homepage and starts on its own: `autoplay muted loop playsinline`, with controls so a visitor can turn the sound on. Safari and Chrome only autoplay muted video, so the `muted` attribute is load-bearing, not cosmetic. The file lives in `site/src/media/` and is copied to `dist/media/`; replace `ScienceDiscovery.mp4` to update the recording.

Typography uses Microsoft YaHei first on every page, including headings, with the bundled Manrope and Source Serif 4 webfonts kept as fallbacks for machines without it.

### Search

The build writes `search-index.json` (English) and `zh/search-index.json` from the rendered documentation, split by heading. `site/src/site.js` loads it on first use and ranks results in the browser. Open it with the top-bar button, `Ctrl/⌘ K`, or `/`.

## Documentation source

`docs/` is a committed symlink to `sciencediscovery/docs`, a shallow sparse checkout of the [product repository](https://github.com/openJiuwen-ai/sciencediscovery) (`main`). The website renders the product's own `docs/en`, `docs/zh` and `docs/images`; nothing is copied or pinned here, so edit documentation upstream only.

- Locally, `npm run build` clones the checkout when it is missing. Run `npm run fetch:docs` to fast-forward it to the latest `main`. The checkout is git-ignored.
- In CI, `pages.yml` checks the product repository out next to this one. It also runs every six hours, so upstream documentation changes reach the site without a commit here.
- Links that leave the docs tree become links into the product repository. A page that exists in only one language is shown in the other with a notice.

The website owns `site/`, `scripts/`, `release.json`, and the workflow. The documentation sidebar and its reading order are driven by the six product-owned groups in `DOC_GROUPS` in `site/build.mjs`. New pages in an existing group appear automatically after the curated pages. Because the documentation is not pinned, a renamed upstream page can break a curated link or a link: `npm run build` fails on missing pages, links and anchors, so the scheduled deployment simply keeps the previous site until this repository is fixed.

## Releases

`release.json` pins the binaries to [0.2.0](https://github.com/openJiuwen-ai/sciencediscovery/releases/tag/0.2.0), with the SHA256 published by the GitHub Release API. When Windows or macOS builds are released, add entries with a matching `name` (or an explicit `"os"`), a `url`, and `sha256`; the install page presents them automatically. Product documentation is rendered from `main` and can describe changes after that release.

## Publishing

`pages.yml` builds from `main` and deploys the artifact with GitHub Pages. Select **GitHub Actions** as the Pages source. Pull requests run the build and link checks without deploying.

## License

[Apache License 2.0](LICENSE). The original license is retained with the copied product documentation.
