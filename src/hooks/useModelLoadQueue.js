import { useEffect, useMemo, useState } from 'react';

const PRIORITY_ORDER = {
  critical: 0,
  normal: 1,
  background: 2,
};

function sortByPriority(models) {
  return [...models].sort((a, b) => {
    const priorityDelta = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
    return priorityDelta || a.name.localeCompare(b.name);
  });
}

function requestIdle(work, timeout = 1200) {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(work, { timeout });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(work, Math.min(timeout, 500));
  return () => window.clearTimeout(id);
}

export function useModelLoadQueue(models, { normalBatchSize = 3 } = {}) {
  const [visibleNames, setVisibleNames] = useState(() => new Set());
  const [phase, setPhase] = useState('加载核心场景');

  const grouped = useMemo(() => {
    const sorted = sortByPriority(models);
    return {
      critical: sorted.filter((model) => model.priority === 'critical'),
      normal: sorted.filter((model) => model.priority === 'normal'),
      background: sorted.filter((model) => model.priority === 'background'),
    };
  }, [models]);

  useEffect(() => {
    setVisibleNames(new Set(grouped.critical.map((model) => model.name)));
    setPhase(grouped.critical.length ? '加载核心场景' : '加载设备模型');

    const timers = [];

    grouped.normal.forEach((model, index) => {
      const batch = Math.floor(index / normalBatchSize);
      const timer = window.setTimeout(() => {
        setPhase('加载设备模型');
        setVisibleNames((current) => new Set(current).add(model.name));
      }, 300 + batch * 350);
      timers.push(() => window.clearTimeout(timer));
    });

    const idleCancel = requestIdle(() => {
      setPhase('后台加载附属模型');
      grouped.background.forEach((model, index) => {
        const timer = window.setTimeout(() => {
          setVisibleNames((current) => new Set(current).add(model.name));
        }, index * 250);
        timers.push(() => window.clearTimeout(timer));
      });
    });
    timers.push(idleCancel);

    return () => timers.forEach((cancel) => cancel());
  }, [grouped, normalBatchSize]);

  const queuedModels = useMemo(
    () => sortByPriority(models).filter((model) => visibleNames.has(model.name)),
    [models, visibleNames],
  );

  return {
    queuedModels,
    phase,
    loadedQueueCount: queuedModels.length,
    totalCount: models.length,
  };
}
