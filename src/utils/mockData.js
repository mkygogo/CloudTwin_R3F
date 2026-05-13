/**
 * 模拟数据生成器 - 开发阶段使用，无需后端即可测试
 */
import useTwinStore from '../store/useTwinStore';

const DEVICES = [
  { id: 'GIS_LMJ', label: 'GIS联络母线', tempRange: [25, 65], pressRange: [0.3, 0.6] },
  { id: 'LMJ', label: '母线', tempRange: [30, 85], pressRange: [0, 0] },
  { id: '4BYZB', label: '4号变压器组', tempRange: [40, 105], pressRange: [0.1, 0.5] },
  { id: '500KVGIS', label: '500KV GIS', tempRange: [20, 60], pressRange: [0.4, 0.7] },
  { id: 'BLQ', label: '避雷器', tempRange: [20, 50], pressRange: [0, 0] },
  { id: 'DLDRQ', label: '电力电容器', tempRange: [25, 75], pressRange: [0, 0] },
  { id: 'DKQ_GLB', label: '电抗器', tempRange: [30, 90], pressRange: [0, 0] },
  { id: 'HKGS', label: '汇控柜室', tempRange: [20, 45], pressRange: [0, 0] },
  { id: 'KGGS', label: '开关柜室', tempRange: [20, 45], pressRange: [0, 0] },
  { id: 'JYZZZ', label: '继电保护装置', tempRange: [20, 40], pressRange: [0, 0] },
  { id: 'XQSKG', label: 'SF6断路器', tempRange: [20, 55], pressRange: [0.4, 0.65] },
];

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

let intervalId = null;

export function startMockData() {
  if (intervalId) return;

  const { setConnected } = useTwinStore.getState();
  setConnected(true);

  intervalId = setInterval(() => {
    const { setDeviceData, addAlert } = useTwinStore.getState();

    DEVICES.forEach(({ id, label, tempRange, pressRange }) => {
      const temperature = randomBetween(tempRange[0], tempRange[1]);
      const pressure = pressRange[1] > 0 ? randomBetween(pressRange[0], pressRange[1]) : null;
      const voltage = randomBetween(498, 502);
      const current = randomBetween(50, 800);
      const warnThreshold = tempRange[0] + (tempRange[1] - tempRange[0]) * 0.8;
      const critThreshold = tempRange[0] + (tempRange[1] - tempRange[0]) * 0.9;
      const status = temperature > critThreshold ? 'critical' : temperature > warnThreshold ? 'warning' : 'normal';

      const data = { temperature, voltage, current, status };
      if (pressure !== null) data.SF6压力 = pressure;
      setDeviceData(id, data);

      if (temperature > warnThreshold) {
        addAlert({
          deviceId: id,
          level: temperature > critThreshold ? 'critical' : 'warning',
          message: `${label} 温度异常: ${temperature}°C`,
        });
      }
    });
  }, 2000);
}

export function stopMockData() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    useTwinStore.getState().setConnected(false);
  }
}
