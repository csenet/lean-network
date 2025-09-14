import React, { useState } from 'react';
import { NetworkDevice, Connection } from '../types/network';
import { generateMacAddress, generateDeviceId } from '../utils/networkUtils';

interface ControlPanelProps {
  onAddDevice: (device: NetworkDevice) => void;
  onSendPacket: (sourceId: string, destinationId: string, type: 'ICMP' | 'ARP' | 'DATA') => void;
  onClearSimulation: () => void;
  onToggleConnectionMode: () => void;
  devices: NetworkDevice[];
  connections: Connection[];
  connectionMode: boolean;
  selectedConnection: Connection | null;
  onRemoveConnection: (connectionId: string) => void;
  simulationSpeed: number;
  onSimulationSpeedChange: (speed: number) => void;
  onLoadPreset?: (presetName: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onAddDevice,
  onSendPacket,
  onClearSimulation,
  onToggleConnectionMode,
  devices,
  connections,
  connectionMode,
  selectedConnection,
  onRemoveConnection,
  simulationSpeed,
  onSimulationSpeedChange,
  onLoadPreset
}) => {
  const [deviceType, setDeviceType] = useState<'client' | 'router' | 'switch'>('client');


  const [packetForm, setPacketForm] = useState({
    sourceId: '',
    destinationId: '',
    type: 'ICMP' as 'ICMP' | 'ARP' | 'DATA'
  });

  const handleAddDevice = () => {
    const deviceNames = {
      client: 'PC',
      router: 'Router',
      switch: 'Switch'
    };

    const existingCount = devices.filter(d => d.type === deviceType).length;
    const deviceName = `${deviceNames[deviceType]}${existingCount + 1}`;

    const newDevice: NetworkDevice = {
      id: generateDeviceId(),
      name: deviceName,
      type: deviceType,
      position: { x: Math.random() * 800 + 100, y: Math.random() * 400 + 100 },
      macAddress: generateMacAddress(),
      arpTable: {},
      macTable: deviceType === 'switch' ? {} : undefined,
      routingTable: deviceType === 'router' ? [] : undefined,
      ports: [] // This will be populated by the hook
    };

    onAddDevice(newDevice);
  };


  const handleSendPacket = () => {
    if (!packetForm.sourceId || !packetForm.destinationId) {
      alert('送信元と宛先を選択してください');
      return;
    }

    if (packetForm.sourceId === packetForm.destinationId) {
      alert('送信元と宛先は異なる必要があります');
      return;
    }

    onSendPacket(packetForm.sourceId, packetForm.destinationId, packetForm.type);
  };

  return (
    <div className="control-panel">
      <h3>コントロールパネル</h3>

      <div className="panel-section">
        <h4>デバイス追加</h4>
        <div className="form-group">
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value as 'client' | 'router' | 'switch')}
          >
            <option value="client">クライアント</option>
            <option value="router">ルーター</option>
            <option value="switch">スイッチ</option>
          </select>
          <button onClick={handleAddDevice}>デバイス追加</button>
        </div>
      </div>


      <div className="panel-section">
        <h4>パケット送信</h4>
        <div className="form-group">
          <select
            value={packetForm.sourceId}
            onChange={(e) => setPacketForm({ ...packetForm, sourceId: e.target.value })}
          >
            <option value="">送信元を選択</option>
            {devices
              .filter(device => device.ipAddress) // IP設定済みのデバイスのみ
              .map(device => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.ipAddress})
                </option>
              ))}
          </select>
          <select
            value={packetForm.destinationId}
            onChange={(e) => setPacketForm({ ...packetForm, destinationId: e.target.value })}
          >
            <option value="">宛先を選択</option>
            {devices
              .filter(device => device.ipAddress) // IP設定済みのデバイスのみ
              .map(device => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.ipAddress})
                </option>
              ))}
          </select>
          <select
            value={packetForm.type}
            onChange={(e) => setPacketForm({ ...packetForm, type: e.target.value as any })}
          >
            <option value="ICMP">ICMP (Ping)</option>
            <option value="ARP">ARP</option>
            <option value="DATA">データ</option>
          </select>
          <button onClick={handleSendPacket}>パケット送信</button>
        </div>
      </div>

      <div className="panel-section">
        <h4>接続管理</h4>
        <div className="form-group">
          <button 
            onClick={onToggleConnectionMode}
            className={connectionMode ? "connection-mode-active" : "connection-mode-button"}
          >
            {connectionMode ? '接続モード終了' : '接続モード開始'}
          </button>
          {connectionMode && (
            <p className="connection-help">
              デバイスを2つ選択して接続を作成
            </p>
          )}
        </div>
        
        <div className="connections-list">
          <h5>現在の接続 ({connections.length})</h5>
          {connections.length === 0 ? (
            <p>接続がありません</p>
          ) : (
            connections.map(connection => {
              const fromDevice = devices.find(d => d.id === connection.fromDeviceId);
              const toDevice = devices.find(d => d.id === connection.toDeviceId);
              return (
                <div key={connection.id} className="connection-item">
                  <span>
                    {fromDevice?.name} ↔ {toDevice?.name}
                  </span>
                  <button 
                    onClick={() => onRemoveConnection(connection.id)}
                    className="remove-connection-button"
                  >
                    切断
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="panel-section">
        <h4>シミュレーション設定</h4>
        <div className="form-group">
          <label>速度: {simulationSpeed}x</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.5"
            value={simulationSpeed}
            onChange={(e) => onSimulationSpeedChange(parseFloat(e.target.value))}
          />
          <button onClick={onClearSimulation} className="clear-button">
            全てクリア
          </button>
        </div>
      </div>


      {onLoadPreset && (
        <div className="panel-section">
          <h4>🎯 プリセット構成</h4>
          <div className="preset-buttons">
            <button 
              onClick={() => onLoadPreset('direct-pcs')}
              className="preset-button"
              title="2台のPCを直接接続した構成"
            >
              PC直接接続
            </button>
            <button 
              onClick={() => onLoadPreset('pcs-switch')}
              className="preset-button"
              title="2台のPCをL2スイッチ経由で接続した構成"
            >
              PC-スイッチ-PC
            </button>
            <button 
              onClick={() => onLoadPreset('network-with-router')}
              className="preset-button"
              title="複雑なネットワーク構成（スイッチ+ルーター+複数PC）"
            >
              ルーター付きネットワーク
            </button>
          </div>
          <p className="preset-description">
            学習に適した構成をワンクリックで作成できます
          </p>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;