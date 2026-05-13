import { create } from 'zustand';

/**
 * 数字孪生全局状态管理
 * - deviceData: 设备实时数据 (来自WebSocket/API)
 * - selectedObject: 当前选中的3D对象
 * - alerts: 告警信息列表
 * - viewMode: 视图模式
 */
const useTwinStore = create((set, get) => ({
  // 设备实时数据 { [deviceId]: { temperature, pressure, status, ... } }
  deviceData: {},

  // 当前选中的3D对象名称
  selectedObject: null,

  // 告警列表
  alerts: [],

  // 视图模式: 'default' | 'heatmap' | 'xray'
  viewMode: 'default',

  // 应用模式: 'viewer' | 'editor'
  appMode: 'viewer',

  // 模型加载计数
  modelsLoadedCount: 0,
  modelsTotalCount: 0,

  // 连接状态
  connected: false,

  // 编辑器: 设备布局 { [name]: { position, rotation, scale } }
  layoutOverrides: {},

  // 编辑器: 当前变换模式 'translate' | 'rotate' | 'scale'
  transformMode: 'translate',

  // 场景列表
  sceneList: [],
  currentSceneId: null,
  scenesLoading: false,

  // --- Actions ---
  setDeviceData: (deviceId, data) =>
    set((state) => ({
      deviceData: { ...state.deviceData, [deviceId]: { ...state.deviceData[deviceId], ...data, _ts: Date.now() } },
    })),

  batchUpdateDeviceData: (updates) =>
    set((state) => {
      const newData = { ...state.deviceData };
      for (const [id, data] of Object.entries(updates)) {
        newData[id] = { ...newData[id], ...data, _ts: Date.now() };
      }
      return { deviceData: newData };
    }),

  setSelectedObject: (name) => set({ selectedObject: name }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [{ id: Date.now(), ts: new Date().toISOString(), ...alert }, ...state.alerts].slice(0, 100),
    })),

  dismissAlert: (id) =>
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),

  setViewMode: (mode) => set({ viewMode: mode }),
  setAppMode: (mode) => set({ appMode: mode }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setModelsTotalCount: (n) => set({ modelsTotalCount: n }),
  resetModelLoadProgress: () => set({ modelsLoadedCount: 0, modelsTotalCount: 0 }),
  incrementModelsLoaded: () => set((state) => ({ modelsLoadedCount: state.modelsLoadedCount + 1 })),
  setConnected: (v) => set({ connected: v }),

  // 编辑器布局操作
  updateLayout: (name, transform) =>
    set((state) => ({
      layoutOverrides: {
        ...state.layoutOverrides,
        [name]: { ...state.layoutOverrides[name], ...transform },
      },
    })),

  exportLayout: () => {
    const overrides = get().layoutOverrides;
    const json = JSON.stringify(overrides, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'substation-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  importLayout: (data) => set({ layoutOverrides: data }),

  // 场景列表管理
  fetchSceneList: async () => {
    set({ scenesLoading: true });
    try {
      const res = await fetch('/scenes/index.json');
      const { scenes } = await res.json();
      set({ sceneList: scenes, scenesLoading: false });
    } catch (e) {
      console.error('Failed to fetch scene list:', e);
      set({ scenesLoading: false });
    }
  },

  loadScene: async (sceneId) => {
    const { sceneList } = get();
    const scene = sceneList.find((s) => s.id === sceneId);
    if (!scene) return;

    if (!scene.file) {
      // 默认布局 → 清空覆盖
      set({ layoutOverrides: {}, currentSceneId: sceneId });
      return;
    }

    try {
      const res = await fetch(scene.file);
      const data = await res.json();
      set({ layoutOverrides: data, currentSceneId: sceneId });
    } catch (e) {
      console.error('Failed to load scene:', e);
    }
  },

  saveSceneToCloud: async (name, description) => {
    const overrides = get().layoutOverrides;
    const id = 'scene-' + Date.now();
    const fileName = `${id}.json`;

    // 保存布局JSON到 public/scenes/
    // 在生产中可改为 POST 到后端API
    const sceneData = JSON.stringify(overrides, null, 2);
    const blob = new Blob([sceneData], { type: 'application/json' });

    // 下载让用户手动放入 public/scenes/ 或通过后端接口保存
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    // 更新本地场景列表
    const newScene = {
      id,
      name: name || `布局 ${new Date().toLocaleDateString()}`,
      description: description || '',
      file: `/scenes/${fileName}`,
      createdAt: new Date().toISOString().slice(0, 10),
      thumbnail: null,
    };

    set((state) => ({
      sceneList: [...state.sceneList, newScene],
      currentSceneId: id,
    }));

    return newScene;
  },
}));

export default useTwinStore;
