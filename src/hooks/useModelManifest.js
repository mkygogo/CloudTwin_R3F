import { useEffect, useMemo, useState } from 'react';

function hasSearchFlag(flag) {
  return new URLSearchParams(window.location.search).has(flag);
}

export function useModelManifest(url = '/models/manifest.json') {
  const [manifest, setManifest] = useState(null);
  const [error, setError] = useState(null);
  const useRawModels = useMemo(() => hasSearchFlag('rawModels'), []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadManifest() {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`模型清单加载失败: ${res.status}`);
        const data = await res.json();
        const models = (data.models || []).map((model) => ({
          ...model,
          file: useRawModels ? model.rawFile || model.file : model.file,
        }));
        setManifest({ ...data, models });
      } catch (e) {
        if (e.name !== 'AbortError') setError(e);
      }
    }

    loadManifest();
    return () => controller.abort();
  }, [url, useRawModels]);

  return {
    manifest,
    models: manifest?.models || [],
    loading: !manifest && !error,
    error,
    useRawModels,
  };
}
