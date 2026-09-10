# paulolo.com liquid.

A React + Vite proof of concept using the actual liquidGL v2.1.0 renderer.

```sh
npm install
npm run dev
npm test
npm run build
```

The default page `/` is the showcase. Other pages: `?view=dashboard` and `?view=playground`.

The dashboard uses fictional data. The playground exposes optical parameters, presets, shape changes, snapshot resolution, reveal replay, and config copying. The showcase uses an original animated light field, three palettes, distortion controls, a keyboard-accessible draggable lens, pause, and fullscreen.

## Integration

The unmodified MIT-licensed library is vendored at `public/vendor/liquidGL.js` from https://github.com/naughtyduk/liquidGL at commit 70e4907f517380d1426881b76e664f8728f2eb79. Attribution is preserved in its header.

The background is drawn locally to canvas and passed to a muted video via `captureStream`, letting liquidGL use its automatic video refraction. No external video assets or backend are needed. Font files load from Google Fonts.

All lenses share one WebGL canvas and z-index. Per-lens options are cloned because upstream initially shares the options object across targets. Native document navigation between the three React pages avoids accumulating renderers/listeners: upstream does not expose a public destroy API. The playground follows the upstream helper implementation to refresh snapshot resolution and replay reveals; those internal methods should be rechecked when upgrading.

WebGL absence uses the library's CSS fallback. Reduced motion starts the light field paused. The public interface keeps technical attribution in a single footer link. No smooth-scroll dependency is installed. This POC has no server, authentication, or persistent data.

## Verification

`npm test` checks every preset and rejects invalid optical settings. Browser checks covered dashboard period/filter/focus controls, presets, shape selection, copy, capture replay, keyboard lens movement, mobile overflow, and the optional WebMCP settings tool's valid and invalid input paths. Browser console had no warnings or errors during those checks.

## Hosting on paulolo.com

Deploy the contents of `dist/` to the domain root. All three pages use query parameters, so no SPA rewrite rules are needed. Canonical, Open Graph, and Twitter metadata target `https://paulolo.com/`; the social preview is `public/og.png`, copied into `dist/og.png` by Vite.

### Docker

```sh
docker build --pull -t paulolo-liquid .
docker run -d --name paulolo-liquid --restart unless-stopped -p 3033:3033 paulolo-liquid
```

Open `http://localhost:3033`. The multi-stage image builds with Node 24 and serves only `dist/` with non-root Nginx on port 3033, with an HTTP health check. Put your HTTPS reverse proxy in front of port 3033 for `paulolo.com`. No runtime environment variables are required. Rebuild with `--pull` to receive base-image updates.
