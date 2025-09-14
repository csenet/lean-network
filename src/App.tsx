import React, { useState } from 'react';
import NetworkCanvas from './components/NetworkCanvas';
import DeviceModal from './components/DeviceModal';
import ControlPanel from './components/ControlPanel';
import DocumentationPanel from './components/DocumentationPanel';
import { useNetworkSimulation } from './hooks/useNetworkSimulation';
import './App.css';

const App: React.FC = () => {
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  
  const {
    devices,
    segments,
    packets,
    connections,
    selectedDevice,
    selectedSegment,
    selectedConnection,
    selectedDeviceData,
    selectedSegmentData,
    selectedConnectionData,
    connectionMode,
    simulationSpeed,
    addDevice,
    updateDevice,
    updateDevicePosition,
    deleteDevice,
    createSegment,
    sendPacket,
    clearSimulation,
    loadPreset,
    selectDevice,
    selectSegment,
    selectConnection,
    setSimulationSpeed,
    handleCanvasClick,
    removeConnection,
    toggleConnectionMode,
    handleDeviceClickForConnection
  } = useNetworkSimulation();

  const handleDeviceClick = (deviceId: string) => {
    if (connectionMode) {
      handleDeviceClickForConnection(deviceId);
    } else {
      selectDevice(deviceId);
      setShowDeviceModal(true);
    }
  };


  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>📦 Packet Explorer</h1>
            <p>L2/L3セグメントとパケット通信を視覚的に学習</p>
          </div>
          <div className="header-right">
            <button 
              onClick={() => setShowDocumentation(true)}
              className="doc-button"
            >
              📚 ドキュメント
            </button>
          </div>
        </div>
      </header>

      <div className="app-content">
        <div className={`left-panel ${leftPanelCollapsed ? 'collapsed' : ''}`}>
          <div className="panel-header">
            <h3>コントロール</h3>
            <button 
              className="panel-toggle"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              title={leftPanelCollapsed ? 'パネルを開く' : 'パネルを閉じる'}
            >
              {leftPanelCollapsed ? '▶' : '◀'}
            </button>
          </div>
          {!leftPanelCollapsed && (
            <ControlPanel
              onAddDevice={addDevice}
              onSendPacket={sendPacket}
              onClearSimulation={clearSimulation}
              onToggleConnectionMode={toggleConnectionMode}
              devices={devices}
              connections={connections}
              connectionMode={connectionMode}
              selectedConnection={selectedConnectionData}
              onRemoveConnection={removeConnection}
              simulationSpeed={simulationSpeed}
              onSimulationSpeedChange={setSimulationSpeed}
              onLoadPreset={loadPreset}
            />
          )}
        </div>

        <div className="main-content">
          <NetworkCanvas
            devices={devices}
            segments={segments}
            packets={packets}
            connections={connections}
            selectedDevice={selectedDevice}
            selectedSegment={selectedSegment}
            selectedConnection={selectedConnection}
            connectionMode={connectionMode}
            simulationSpeed={simulationSpeed}
            onDeviceClick={handleDeviceClick}
            onSegmentClick={selectSegment}
            onConnectionClick={selectConnection}
            onCanvasClick={handleCanvasClick}
            onDeviceMove={updateDevicePosition}
          />

          <div className="status-bar">
            <div className="legend">
              <span className="legend-item">
                <div className="legend-color client"></div>
                クライアント
              </span>
              <span className="legend-item">
                <div className="legend-color router"></div>
                ルーター
              </span>
              <span className="legend-item">
                <div className="legend-color switch"></div>
                スイッチ
              </span>
              <span className="legend-item">
                <div className="legend-color packet-icmp"></div>
                ICMP
              </span>
              <span className="legend-item">
                <div className="legend-color packet-arp"></div>
                ARP
              </span>
              <span className="legend-item">
                <div className="legend-color packet-data"></div>
                データ
              </span>
            </div>
            <div className="simulation-info">
              デバイス数: {devices.length} | 接続数: {connections.length} | セグメント数: {segments.length} | アクティブパケット: {packets.length}
              {connectionMode && <span className="connection-mode-indicator"> | 🔗 接続モード</span>}
            </div>
          </div>
        </div>
      </div>


      <DeviceModal
        device={selectedDeviceData}
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        onDeviceUpdate={updateDevice}
        onDeviceDelete={deleteDevice}
      />

      <DocumentationPanel
        isOpen={showDocumentation}
        onClose={() => setShowDocumentation(false)}
      />
    </div>
  );
};

export default App;
