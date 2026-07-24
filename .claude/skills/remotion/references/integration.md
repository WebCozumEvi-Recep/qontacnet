# Adding Remotion to an existing app & embedding the Player

## Install into an existing project

```bash
npm i remotion @remotion/cli
# optional, depending on need:
npm i @remotion/player          # embed an interactive player in your React app
npm i @remotion/bundler @remotion/renderer   # programmatic rendering
```

Create a `remotion/` (or `src/remotion/`) folder that is self-contained:

```
remotion/
├── index.ts        // registerRoot(Root)
├── Root.tsx        // <Composition> registrations
└── MyVideo.tsx     // the component(s)
```

`index.ts`:
```ts
import { registerRoot } from "remotion";
import { Root } from "./Root";
registerRoot(Root);
```

Add scripts to `package.json`:
```json
{
  "scripts": {
    "remotion:studio": "remotion studio remotion/index.ts",
    "remotion:render": "remotion render remotion/index.ts"
  }
}
```

Keep Remotion components free of app-specific server code (no DB calls, no
`next/headers`, etc.) — they must run inside Remotion's bundler and during render.
Pass data in through composition props instead.

## Embedding `<Player>` in React / Next.js

`@remotion/player` renders a composition interactively in the browser (play,
pause, seek) without producing a file. It's a client component.

```tsx
"use client";
import { Player } from "@remotion/player";
import { MyVideo } from "@/remotion/MyVideo";

export function VideoPreview() {
  return (
    <Player
      component={MyVideo}
      durationInFrames={150}
      fps={30}
      compositionWidth={1920}
      compositionHeight={1080}
      style={{ width: "100%" }}
      controls
      inputProps={{ title: "Hello" }}
      // loop autoPlay
    />
  );
}
```

Next.js (App Router) notes:
- Mark the file `"use client"` — the Player uses browser APIs.
- The Player **previews**; it does not export a video. To get an MP4 you still
  render server-side (see `rendering.md`).
- If you only ever preview (no file output), you don't need
  `@remotion/bundler`/`@remotion/renderer`.

## Render-on-demand in a Next.js app

Run the `@remotion/renderer` pipeline in a **Node** runtime route or a background
worker, never edge. For anything beyond a few seconds, enqueue a job and render
asynchronously, then store the result and notify the user. See `rendering.md` for
the pipeline and the "triggering from a web app" pattern.

## Webpack / bundler interplay

Remotion uses its own bundler for studio/render, so your app's build config and
Remotion's are independent. If your video components import app aliases (e.g.
`@/...`), provide a matching alias via `bundle()`'s `webpackOverride`, or keep the
`remotion/` folder dependency-light to avoid the issue entirely.
