const metricState = {
  firstModelSeen: false,
  modelCount: 0,
};

function now() {
  return Math.round(performance.now());
}

export function markLoadMetric(name, detail = {}) {
  if (!import.meta.env.DEV) return;

  const entry = {
    name,
    atMs: now(),
    ...detail,
  };

  window.__cloudTwinLoadMetrics = window.__cloudTwinLoadMetrics || [];
  window.__cloudTwinLoadMetrics.push(entry);
  console.info('[CloudTwin metric]', entry);
}

export function markModelLoaded(name, totalCount) {
  metricState.modelCount += 1;

  if (!metricState.firstModelSeen) {
    metricState.firstModelSeen = true;
    markLoadMetric('firstModelVisible', { model: name });
  }

  if (totalCount && metricState.modelCount >= totalCount) {
    markLoadMetric('allModelsVisible', { totalCount });
  }
}

export function resetModelMetrics() {
  metricState.firstModelSeen = false;
  metricState.modelCount = 0;
  markLoadMetric('modelQueueReset');
}
