import React, { useState } from 'react';
import NetworkCanvas from './components/NetworkCanvas';
import DevicePanel from './components/DevicePanel';
import ControlPanel from './components/ControlPanel';
import DocumentationPanel from './components/DocumentationPanel';
import Terminal from './components/Terminal';
import { useNetworkSimulation } from './hooks/useNetworkSimulation';
import './App.css';

const App: React.FC = () => {
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  
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
    selectSegment,
    selectConnection,
    setSimulationSpeed,
    handleCanvasClick,
    removeConnection,
    toggleConnectionMode,
    handleDeviceClickForConnection
  } = useNetworkSimulation();

  const handleTerminalCommand = (deviceId: string, command: string) => {
    const args = command.trim().split(' ');
    const cmd = args[0].toLowerCase();

    if (cmd === 'ping' && args.length > 1) {
      const targetIp = args[1];
      const targetDevice = devices.find(d => d.ipAddress === targetIp);
      
      if (targetDevice) {
        // Send actual ping packet
        sendPacket(deviceId, targetDevice.id, 'ICMP');
      }
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
              onClick={() => setShowTerminal(!showTerminal)}
              className="terminal-button"
            >
              🖥️ ターミナル
            </button>
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
              onCreateSegment={createSegment}
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
            onDeviceClick={handleDeviceClickForConnection}
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

        <div className={`right-panel ${rightPanelCollapsed ? 'collapsed' : ''}`}>
          <div className="panel-header">
            <h3>情報パネル</h3>
            <button 
              className="panel-toggle"
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              title={rightPanelCollapsed ? 'パネルを開く' : 'パネルを閉じる'}
            >
              {rightPanelCollapsed ? '◀' : '▶'}
            </button>
          </div>
          {!rightPanelCollapsed && (
            <>
              <DevicePanel
                device={selectedDeviceData}
                onDeviceUpdate={updateDevice}
                onDeviceDelete={deleteDevice}
                onOpenTerminal={() => setShowTerminal(true)}
              />

              {selectedSegmentData && (
                <div className="segment-panel">
                  <h3>セグメント情報</h3>
                  <div className="segment-info">
                    <p><strong>名前:</strong> {selectedSegmentData.name}</p>
                    <p><strong>タイプ:</strong> {selectedSegmentData.type}</p>
                    {selectedSegmentData.network && (
                      <p><strong>ネットワーク:</strong> {selectedSegmentData.network}/{selectedSegmentData.mask}</p>
                    )}
                    <p><strong>デバイス数:</strong> {selectedSegmentData.devices.length}</p>
                    <div className="segment-devices">
                      <strong>含まれるデバイス:</strong>
                      <ul>
                        {selectedSegmentData.devices.map(deviceId => {
                          const device = devices.find(d => d.id === deviceId);
                          return device ? (
                            <li key={deviceId}>
                              {device.name} ({device.ipAddress || 'IP未設定'})
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="learning-panel">
                <h3>学習ガイド</h3>
                <div className="learning-content">
                  <div className="learning-section">
                    <h4>L2セグメント（データリンク層）</h4>
                    <ul>
                      <li>同じスイッチに接続されたデバイス群</li>
                      <li>MACアドレスで通信</li>
                      <li>ブロードキャストドメイン</li>
                      <li>スイッチがMACアドレステーブルを管理</li>
                    </ul>
                  </div>

                  <div className="learning-section">
                    <h4>L3セグメント（ネットワーク層）</h4>
                    <ul>
                      <li>同じサブネットのデバイス群</li>
                      <li>IPアドレスで通信</li>
                      <li>ルーターが異なるセグメント間を接続</li>
                      <li>ルーティングテーブルで経路決定</li>
                    </ul>
                  </div>

                  <div className="learning-section">
                    <h4>パケット種類</h4>
                    <ul>
                      <li><strong>ARP:</strong> IPアドレスからMACアドレスを解決</li>
                      <li><strong>ICMP:</strong> Pingなどの制御メッセージ</li>
                      <li><strong>データ:</strong> 実際のデータ通信</li>
                    </ul>
                  </div>

                  <div className="learning-section">
                    <h4>使い方のヒント</h4>
                    <ol>
                      <li>デバイスを追加して配置</li>
                      <li>セグメントを作成してグループ化</li>
                      <li>IPアドレスを設定</li>
                      <li>パケット送信でルーティングを確認</li>
                      <li>ARPテーブルの変化を観察</li>
                    </ol>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Terminal
        selectedDevice={selectedDeviceData}
        devices={devices}
        onExecuteCommand={handleTerminalCommand}
        isVisible={showTerminal}
        onToggle={() => setShowTerminal(!showTerminal)}
      />

      <DocumentationPanel 
        isOpen={showDocumentation}
        onClose={() => setShowDocumentation(false)}
      />
    </div>
  );
};

export default App;
