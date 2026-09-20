# ScienceDiscovery website

The public website at <https://sciencediscovery.github.io/> provides Linux binary downloads, deployment guides, and the bilingual ScienceDiscovery user documentation.

## Develop and preview

Use Node.js 22.19 or later:

```sh
npm ci
npm run dev
```

For a production preview:

```sh
npm run build
npm run serve
```

Both servers use <http://127.0.0.1:4173/> and refuse to silently choose another port. The build validates local links, fragments, images, and the integrity of the synced documentation. The product's application ports are independent of this website.

## Documentation source

`docs/README.md`, `docs/en/`, `docs/zh/`, `docs/architecture/`, `docs/images/`, and `LICENSE` are copied from the [product repository](https://gitcode.com/openJiuwen/sciencediscovery). `docs-source.json` records the source revision and each copied file's SHA256. Copied pages retain their original Markdown, screenshots, and directory structure. The website renders links that leave the docs tree as public links to the [GitHub product repository](https://github.com/openJiuwen-ai/sciencediscovery).

To refresh from a clean product checkout:

```sh
npm run sync:docs -- ../sciencediscovery
npm run build
```

The script only reads the source checkout. It replaces files recorded in the source manifest and removes obsolete synced files. It never writes to the product repository. Make product documentation edits upstream first, then sync. The landing pages, theme, workflow, source manifest, and copied documents are all committed together on `main`; deployments do not fetch documentation from another repository.

`docs/index.md`, `docs/en/index.md`, `docs/zh/index.md`, `docs/public/`, and `docs/.vitepress/` belong to the website. Navigation is generated from the source documents. The language menu opens the selected language's homepage because some source topics currently only have a Chinese page.

The binary download metadata in `release.json` is pinned to [0.2.0](https://github.com/openJiuwen-ai/sciencediscovery/releases/tag/0.2.0), including the checksums published by the GitHub Release API. Product documentation is a snapshot of the main branch and can describe changes after that release. Review the release independently when updating download metadata.

The renderer uses GitHub-compatible heading anchors and treats angle-bracket placeholders in upstream prose as literal text. Vite is overridden to its patched 6.4.3 release while VitePress stays on the stable 1.6 series.

## Browser verification

The committed test manifest pins Playwright to 1.61.1. Assemble the isolated test environment and run against the production preview:

```sh
node test/sync-e2e.mjs --write
npm ci --prefix .e2e
.e2e/node_modules/.bin/playwright install chromium
npm run build
npm run test:e2e
```

Browser tests start the preview on port 4173 when it is not already running. Tests cover downloads, checksums, deployment, language switching, documentation navigation, search, screenshots, and a mobile viewport. Reports and browser artifacts remain in the ignored `.e2e/` directory.

## Publishing

The `pages.yml` workflow builds from `main` and deploys the build artifact using GitHub Pages. Select **GitHub Actions** as the repository's Pages source. Pull requests run the build and link checks without deploying. No separate documentation branch or `gh-pages` branch is used.

## License

[Apache License 2.0](LICENSE). The original license is retained with the copied product documentation.
