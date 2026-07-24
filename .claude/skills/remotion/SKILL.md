---
name: remotion
description: >-
  Create, preview, and render videos programmatically with Remotion — the React
  framework for making real MP4/WebM/GIF videos from components. Use this skill
  whenever the user wants to build a video, animation, animated intro/outro,
  social clip, explainer, motion graphic, data-driven or templated video, an
  animated logo, or wants to embed a React-driven video player, even if they
  don't say the word "Remotion". Also use it for anything involving
  @remotion/player, @remotion/renderer, @remotion/lambda, remotion compositions,
  useCurrentFrame, interpolate, spring, Sequence, or `npx remotion render`.
  Reference: https://github.com/remotion-dev/remotion
---

# Remotion

Remotion turns React components into videos. Each frame is a render of your
component at a specific point in time; Remotion plays the frames in sequence and
encodes them into a video file with ffmpeg. Because the whole video is just code,
it is ideal for templated, data-driven, or programmatically generated videos.

## Mental model (read this first)

The single most important idea: **animation is a pure function of the current
frame.** You don't run timers or imperative animations. Instead you read the
current frame and compute what the screen should look like at that frame.

```tsx
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const FadeIn = () => {
  const frame = useCurrentFrame();              // 0, 1, 2, ... per frame
  const { fps, durationInFrames } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps], [0, 1], {
    extrapolateRight: "clamp",                  // stay at 1 after 1 second
  });
  return <div style={{ opacity }}>Hello</div>;
};
```

This determinism is why renders are reproducible and parallelizable. Never use
`setTimeout`, `requestAnimationFrame`, `Date.now()`, or random values without a
seed — two renders of the same frame must produce identical output.

## Decide what the user actually needs

Pick the path that matches the request before writing code:

1. **New standalone video project** → scaffold with `npm create video@latest`.
   See "Scaffolding" below.
2. **Add Remotion to an existing app** (e.g. this Next.js repo) to render videos
   or embed a player → install packages and add a `remotion/` folder. See
   `references/integration.md`.
3. **Embed an interactive video player in a React/Next page** → use
   `@remotion/player`'s `<Player>`. See `references/integration.md`.
4. **Render a video to a file** (CLI or programmatic / server / CI) → see
   "Rendering" below and `references/rendering.md`.
5. **Just an animation/composition** in an existing Remotion project → write the
   component and register a `<Composition>`. See "Compositions" below.

When unsure which the user wants, ask one short question rather than guessing —
scaffolding a whole project when they wanted a single composition wastes effort.

## Scaffolding a new project

```bash
npm create video@latest        # interactive; pick a template (Blank is good)
cd <project>
npm run dev                     # opens Remotion Studio (live preview at :3000)
```

Key files:
- `src/Root.tsx` — registers every `<Composition>` (the list shown in Studio).
- `src/index.ts` — calls `registerRoot(Root)`.
- `remotion.config.ts` — render/preview config (image format, overwrite, etc.).

## Compositions

A `<Composition>` declares a renderable video: its id, the component, dimensions,
fps, and length. Everything the user can render must be registered in `Root.tsx`.

```tsx
import { Composition } from "remotion";
import { MyVideo } from "./MyVideo";

export const Root = () => (
  <>
    <Composition
      id="MyVideo"                 // used by `npx remotion render MyVideo`
      component={MyVideo}
      durationInFrames={150}       // 5s at 30fps
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ title: "Hello" }}   // typed; drives the props panel in Studio
    />
  </>
);
```

Common canvases: 1920×1080 (landscape), 1080×1920 (vertical / Reels / TikTok),
1080×1080 (square). Duration in **frames**, so seconds × fps.

## The core API you'll use constantly

- `useCurrentFrame()` → current frame number.
- `useVideoConfig()` → `{ fps, durationInFrames, width, height }`.
- `interpolate(frame, inputRange, outputRange, options)` → map frame ranges to
  values. Almost always pass `{ extrapolateLeft: "clamp", extrapolateRight:
  "clamp" }` unless you want values to keep extrapolating past the range.
- `spring({ frame, fps, config })` → natural, physically-based motion. Great for
  entrances. Tune with `config: { damping, stiffness, mass }`.
- `<AbsoluteFill>` → a full-screen absolutely-positioned div; the default layout
  building block (stack layers by nesting these).
- `<Sequence from={f} durationInFrames={n}>` → time-shift children so their
  `useCurrentFrame()` starts at 0 when the sequence begins. This is how you place
  things on a timeline.
- `<Series>` → play segments back-to-back without computing offsets by hand.
- `<Img>`, `<Video>` / `<OffthreadVideo>`, `<Audio>` → media that stays in sync
  with the timeline. Use these instead of raw `<img>/<video>/<audio>`.
- `staticFile("name.png")` → reference a file in the project's `public/` folder.
- `interpolateColors(...)` → animate between colors.

`<OffthreadVideo>` is usually preferable to `<Video>` for rendering (more
accurate frame extraction). Use `<Video>` when you need real DOM video behavior
during preview.

For a fuller cheatsheet with worked examples (staggered lists, scene
transitions, audio sync, captions), read `references/api.md`.

## Rendering to a file

CLI (simplest):

```bash
npx remotion render <CompositionId> out/video.mp4
npx remotion render MyVideo out/video.mp4 --props='{"title":"Custom"}'
npx remotion still MyVideo out/thumbnail.png --frame=30   # single frame → image
npx remotion render MyVideo out/clip.gif                   # extension picks codec
```

Programmatic rendering (server, API route, CI) uses `@remotion/renderer`:
`bundle()` → `selectComposition()` → `renderMedia()`. This needs a Node
environment with Chromium available, so it does **not** run in the browser or in
edge runtimes. See `references/rendering.md` for the full pattern, passing
`inputProps`, concurrency, and the Lambda/Cloud Run options for scale.

## Common pitfalls (save yourself debugging time)

- **Non-deterministic code breaks renders.** No `Math.random()` without a seeded
  RNG, no `Date.now()`, no animation that depends on wall-clock time. Drive
  everything off `useCurrentFrame()`.
- **Forgetting `extrapolate` clamps** makes values shoot past their target
  before/after the input range. Clamp unless you want the extrapolation.
- **Using raw `<video>/<audio>/<img>`** desyncs from the timeline and may render
  blank frames. Use Remotion's components + `staticFile()`.
- **Duration is in frames, not seconds.** A "10 second" video at 30fps is
  `durationInFrames={300}`.
- **Assets must be in `public/`** and loaded via `staticFile()`, not imported by
  relative path, or they won't resolve during render.
- **Heavy work per frame** (re-parsing large data, re-creating big objects) slows
  every frame ×fps×duration. Compute once with `useMemo` keyed on inputs.

## Reference files

- `references/api.md` — expanded API cheatsheet with worked animation examples.
- `references/rendering.md` — CLI flags, programmatic `@remotion/renderer`
  pipeline, and cloud rendering (Lambda / Cloud Run).
- `references/integration.md` — adding Remotion to an existing app, embedding
  `<Player>` in React/Next.js, and SSR/render-on-demand notes.

Authoritative docs live at https://www.remotion.dev/docs and the source at
https://github.com/remotion-dev/remotion. Remotion's API evolves; when a detail
matters (exact prop names, new packages), verify against the installed version's
docs rather than relying on memory.

## Licensing note (mention to the user when relevant)

Remotion is free for individuals and small teams but requires a **paid company
license** for larger for-profit companies. If the user is building something
commercial at a company, flag that they should check
https://remotion.pro / the LICENSE in the repo before shipping. This isn't legal
advice — just a heads-up so they aren't surprised.
