# Liquid Observatory

A React + Vite proof of concept using the actual liquidGL v2.1.0 renderer.

```sh
npm install
npm run dev
npm test
npm run build
```

Pages: `?view=dashboard`, `?view=playground`, and `?view=showcase`.

The dashboard uses fictional data. The playground exposes optical parameters, presets, shape changes, snapshot resolution, reveal replay, and config copying. The showcase uses an original animated light field, three palettes, distortion controls, a keyboard-accessible draggable lens, pause, and fullscreen.

## Integration

The unmodified MIT-licensed library is vendored at `public/vendor/liquidGL.js` from https://github.com/naughtyduk/liquidGL at commit 70e4907f517380d1426881b76e664f8728f2eb79. Attribution is preserved in its header.

The background is drawn locally to canvas and passed to a muted video via `captureStream`, letting liquidGL use its automatic video refraction. No external video assets or backend are needed. Font files load from Google Fonts.

All lenses share one WebGL canvas and z-index. Per-lens options are cloned because upstream initially shares the options object across targets. Native document navigation between the three React pages avoids accumulating renderers/listeners: upstream does not expose a public destroy API. The playground follows the upstream helper implementation to refresh snapshot resolution and replay reveals; those internal methods should be rechecked when upgrading.

WebGL absence uses the library's CSS fallback. Reduced motion starts the light field paused. Dynamic DOM registration, smooth-scroll adapters, developer helper, and capture boundaries are described in the playground; no smooth-scroll dependency is installed. This POC has no server, authentication, or persistent data.

## Verification

`npm test` checks every preset and rejects invalid optical settings. Browser checks covered dashboard period/filter/focus controls, presets, shape selection, copy, capture replay, keyboard lens movement, mobile overflow, and the optional WebMCP settings tool's valid and invalid input paths. Browser console had no warnings or errors during those checks.
