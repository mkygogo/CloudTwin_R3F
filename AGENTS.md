# CloudTwin_R3F Agent Notes

## Project Summary

CloudTwin_R3F is a React + Vite digital-twin viewer for a substation scene. It renders multiple GLB equipment models with React Three Fiber, supports click/hover selection, viewer/editor modes, scene layout import/export, and simulated device telemetry.

Primary stack:

- React 19, Vite 8
- Three.js, `@react-three/fiber`, `@react-three/drei`
- Zustand for app state
- Socket.IO for the optional realtime data server
- Nginx + Docker for production serving

The main frontend entry is `src/App.jsx`. The primary 3D scene is `src/components/Scene/SubstationScene.jsx`; equipment rendering is handled by `src/components/Model/SubstationModel.jsx`.

## Current Runtime Layout

Local LAN development machine:

- SSH target: `jr@192.168.3.38`
- Project path: `/home/jr/CloudTwin_R3F`
- Frontend dev URL: `http://192.168.3.38:3000`
- Backend health URL: `http://192.168.3.38:4000/health`

Cloud deployment:

- Host: `test.shjrinfo.com:8443`
- Server path: `/home/ubuntu/cloudtwin`
- Frontend container: `cloudtwin-frontend`
- Backend container: `cloudtwin-backend`
- Public URL: `https://test.shjrinfo.com:8443/`

Do not commit passwords, private keys, SSL private keys, or personal access tokens. Existing deployment credentials should stay outside the repository.

## Common Commands

Run from the repository root on the LAN development machine:

```bash
npm ci
npm run dev -- --host 0.0.0.0
npm run lint -- --max-warnings=0
npm run build
```

Backend development:

```bash
cd server
npm ci
npm run dev
```

Generate optimized GLB assets:

```bash
npm run optimize:models
```

The build output is `dist/`. For cloud deployment, the current manual flow is to build on the LAN machine, sync the latest `dist/` to `/home/ubuntu/cloudtwin/dist`, then rebuild and restart `cloudtwin-frontend`.

## Model Loading Architecture

The project uses a manifest-driven loading flow:

- Manifest: `public/models/manifest.json`
- Optimized GLB assets: `public/models-optimized/v1/*.glb`
- Original GLB fallback assets: `public/models/*.glb`
- Queue hook: `src/hooks/useModelLoadQueue.js`
- Manifest hook: `src/hooks/useModelManifest.js`

Default behavior loads optimized models from `/models-optimized/v1/`. Add `?rawModels=1` to the URL to use original `/models/*.glb` files for visual comparison or troubleshooting.

Model priorities:

- `critical`: rendered first for fast first scene visibility
- `normal`: loaded in small batches after the first scene is visible
- `background`: loaded during browser idle time

The scene keeps UI, lights, grid, and camera available while models load. Each model has its own Suspense boundary and failure fallback, so one failed model should not block the rest of the scene.

## Loading Metrics

Load metrics are recorded in development builds through `src/utils/loadMetrics.js`.

Check the browser console or inspect:

```js
window.__cloudTwinLoadMetrics
```

Important events:

- `uiReady`
- `manifestReady`
- `modelQueueReset`
- `firstModelVisible`
- `allModelsVisible`

The FPS panel is hidden by default. Enable it with:

```text
?stats=1
```

or:

```bash
VITE_SHOW_STATS=true
```

## UI Notes

The top-center loading progress overlay appears while models are loading and disappears when all models are visible. It should remain screen-fixed, not tied to the 3D camera. Keep it compact so it does not compete with the left status panel or top-right scene selector.

The left status panel shows total loaded model count from Zustand. When changing model loading behavior, keep `modelsLoadedCount` and `modelsTotalCount` consistent.

## Deployment Notes

Nginx caches optimized models aggressively:

```nginx
location /models-optimized/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin *;
}
```

Because optimized assets are served with long-lived cache headers, change the version directory, for example `v2`, if replacing model contents in a way that browsers must pick up immediately.

The original `/models/` path remains available for `?rawModels=1` and receives shorter caching.

## Testing Checklist

Before committing:

```bash
npm run lint -- --max-warnings=0
npm run build
```

Manual checks:

- Open `http://192.168.3.38:3000`
- Confirm top-center loading progress appears during model loading
- Confirm models continue loading in batches
- Confirm `?rawModels=1` still renders the original models
- Confirm `?stats=1` shows FPS without being enabled by default
- Check viewer mode selection and editor mode transform controls

For cloud deployment verification:

```bash
curl -k -I https://test.shjrinfo.com:8443/
curl -k -I https://test.shjrinfo.com:8443/models-optimized/v1/GIS_LMJ.glb
curl -k -s https://test.shjrinfo.com:8443/models/manifest.json
```

