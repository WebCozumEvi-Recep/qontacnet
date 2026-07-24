# Remotion API cheatsheet (worked examples)

Everything here is driven by `useCurrentFrame()`. Keep animations pure.

## interpolate — the workhorse

```tsx
const frame = useCurrentFrame();
// slide in from the left over the first 20 frames, then hold
const x = interpolate(frame, [0, 20], [-200, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
// multi-stop: fade in, hold, fade out
const opacity = interpolate(
  frame,
  [0, 15, 100, 115],
  [0, 1, 1, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);
// custom easing
import { Easing } from "remotion";
const eased = interpolate(frame, [0, 30], [0, 1], {
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  extrapolateRight: "clamp",
});
```

## spring — natural motion

```tsx
const { fps } = useVideoConfig();
const frame = useCurrentFrame();
const scale = spring({
  frame,
  fps,
  config: { damping: 12, stiffness: 120, mass: 1 },
});
return <div style={{ transform: `scale(${scale})` }}>Pop</div>;
```

`spring()` returns ~0 → ~1. Multiply it into transforms. Lower `damping` =
bouncier. Use `from`/`to` options or scale the output to animate other ranges.

## Sequence — placing things on a timeline

Children of a `<Sequence from={N}>` see `useCurrentFrame()` starting at 0 when
the sequence begins, so each component can be written as if it starts at time 0.

```tsx
<AbsoluteFill>
  <Sequence durationInFrames={40}>
    <Title />
  </Sequence>
  <Sequence from={40} durationInFrames={60}>
    <Body />          {/* its frame 0 is the global frame 40 */}
  </Sequence>
</AbsoluteFill>
```

## Series — back-to-back scenes without manual offsets

```tsx
import { Series } from "remotion";

<Series>
  <Series.Sequence durationInFrames={40}><SceneA /></Series.Sequence>
  <Series.Sequence durationInFrames={50}><SceneB /></Series.Sequence>
  <Series.Sequence durationInFrames={40} offset={-10}><SceneC /></Series.Sequence>
</Series>
```

`offset` overlaps a scene with the previous one — handy for crossfades.

## Staggered list (each item enters slightly later)

```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();
return items.map((item, i) => {
  const delay = i * 5;                      // 5 frames between items
  const enter = spring({ frame: frame - delay, fps, config: { damping: 14 } });
  return (
    <div key={item.id} style={{
      opacity: enter,
      transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
    }}>{item.label}</div>
  );
});
```

## Scene transition (crossfade between two full-screen layers)

```tsx
const frame = useCurrentFrame();
const t = interpolate(frame, [30, 45], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
return (
  <AbsoluteFill>
    <AbsoluteFill style={{ opacity: 1 - t }}><SceneA /></AbsoluteFill>
    <AbsoluteFill style={{ opacity: t }}><SceneB /></AbsoluteFill>
  </AbsoluteFill>
);
```

## Media: image, video, audio

```tsx
import { Img, OffthreadVideo, Audio, staticFile, Sequence } from "remotion";

<Img src={staticFile("logo.png")} />
<OffthreadVideo src={staticFile("clip.mp4")} />
<Audio src={staticFile("music.mp3")} volume={0.6} />

{/* start audio at frame 30, and fade its volume with the frame */}
<Sequence from={30}>
  <Audio
    src={staticFile("vo.mp3")}
    volume={(f) => interpolate(f, [0, 15], [0, 1], { extrapolateRight: "clamp" })}
  />
</Sequence>
```

Remote URLs work too (`src="https://..."`), but bundle critical assets in
`public/` for reproducible renders.

## Dynamic / data-driven video via props

```tsx
type Props = { name: string; stats: { label: string; value: number }[] };

export const Report: React.FC<Props> = ({ name, stats }) => { /* ... */ };

// Root.tsx
<Composition
  id="Report"
  component={Report}
  durationInFrames={180}
  fps={30}
  width={1080}
  height={1080}
  defaultProps={{ name: "Acme", stats: [] }}
/>
```

Override at render time with `--props='{"name":"Beta","stats":[...]}'` (CLI) or
`inputProps` (programmatic). Use `calculateMetadata` on the `<Composition>` to
derive duration/dimensions from props (e.g. length depends on number of items).

## Fonts

Prefer `@remotion/google-fonts` (`loadFont()`), or self-host and load via CSS in
`public/`. Make sure the font is loaded before the frame renders, or text may
flash unstyled / shift during render.

## Captions / subtitles

`@remotion/captions` + `@remotion/transcribe` (Whisper) handle generating and
rendering timed captions. For simple cases, drive caption visibility off the
frame with `interpolate`/`Sequence` as shown above.
