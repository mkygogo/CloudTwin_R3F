import SubstationScene from './components/Scene/SubstationScene';
import StatusPanel from './components/UI/StatusPanel';
import DevicePanel from './components/UI/DevicePanel';
import AlertList from './components/UI/AlertList';
import Toolbar from './components/UI/Toolbar';
import EditorPanel from './components/UI/EditorPanel';
import SceneSelector from './components/UI/SceneSelector';
import useTwinStore from './store/useTwinStore';
import './App.css';

export default function App() {
  const appMode = useTwinStore((s) => s.appMode);

  return (
    <div className="app-root">
      <SubstationScene />
      <StatusPanel />
      <SceneSelector />
      {appMode === 'viewer' && <DevicePanel />}
      {appMode === 'viewer' && <AlertList />}
      {appMode === 'editor' && <EditorPanel />}
      <Toolbar />
    </div>
  );
}
