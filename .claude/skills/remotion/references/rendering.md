# Rendering Remotion videos

## CLI

```bash
# render a composition to a file (codec inferred from extension)
npx remotion render <CompositionId> out/video.mp4
npx remotion render MyVideo out/video.webm
npx remotion render MyVideo out/anim.gif

# pass dynamic props (JSON) — overrides the composition's defaultProps
npx remotion render MyVideo out/video.mp4 --props='{"title":"Hi"}'
npx remotion render MyVideo out/video.mp4 --props=./props.json

# single still frame → image
npx remotion still MyVideo out/thumb.png --frame=30

# useful flags
--concurrency=4            # parallel frame rendering (defaults to CPU-based)
--scale=2                  # render at higher resolution
--frames=0-90              # render a frame range only
--codec=h264|h265|vp8|vp9|prores|gif
--crf=18                   # quality (lower = better/larger, h264 ~18-23)
--image-format=jpeg|png    # per-frame capture format
--log=verbose              # debug render issues
```

`npx remotion studio` opens the live preview/editor. `npx remotion compositions`
lists composition ids.

## Programmatic rendering (`@remotion/renderer`)

For rendering from a script, server, API route, or CI. Requires Node + Chromium
(Remotion downloads a compatible Chromium Headless Shell). It cannot run in the
browser or on edge runtimes — use a Node server or a queue/worker.

```ts
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";

// 1. Bundle the Remotion project once (cache this in production).
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  // webpackOverride: (c) => c,   // if you need custom webpack config
});

// 2. Resolve the composition (with the props you'll render).
const inputProps = { title: "Generated" };
const composition = await selectComposition({
  serveUrl,
  id: "MyVideo",
  inputProps,
});

// 3. Render to a file.
await renderMedia({
  serveUrl,
  composition,
  codec: "h264",
  outputLocation: "out/video.mp4",
  inputProps,
  concurrency: 4,
  // onProgress: ({ progress }) => console.log(progress),
});
```

Notes:
- `bundle()` is the slow step; do it once and reuse `serveUrl` across renders.
- Pass the **same** `inputProps` to `selectComposition` and `renderMedia` so
  duration/metadata and the actual render agree.
- Use `renderStill()` for a single image.
- In serverless/containers, ensure the required system libs for Chromium are
  present (Remotion's docs list them per platform).

## Rendering at scale (cloud)

- **`@remotion/lambda`** — render on AWS Lambda, massively parallel across frames.
  Deploy a function + site, then `renderMediaOnLambda()`. Best for high volume /
  on-demand user-generated videos.
- **`@remotion/cloudrun`** — the Google Cloud Run equivalent.

Both follow the same shape: deploy the bundled site, then trigger a render with
`inputProps`. Check current docs for the exact deploy commands and IAM/permission
setup, since these evolve.

## Triggering a render from a web app

Don't render in the request handler synchronously for anything non-trivial —
renders take seconds to minutes. Instead:
1. Accept the request, enqueue a job (DB row / queue) with the `inputProps`.
2. A worker (Node) runs the `@remotion/renderer` pipeline or calls Lambda.
3. Upload the result to storage and notify the user (webhook / poll / email).

For short, simple clips an API route can render inline, but set a generous
timeout and run on a Node runtime (not edge).
