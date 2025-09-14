import React, { useState } from 'react';
import { NetworkDevice, Connection } from '../types/network';
import { generateMacAddress, generateDeviceId, validateIpAddress } from '../utils/networkUtils';

interface ControlPanelProps {
  onAddDevice: (device: NetworkDevice) => void;
  onCreateSegment: (type: 'L2' | 'L3', name: string, network?: string, mask?: string) => void;
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
  onCreateSegment,
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
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    type: 'client' as 'client' | 'router' | 'switch',
    ipAddress: '',
    subnetMask: '255.255.255.0',
    defaultGateway: ''
  });

  const [segmentForm, setSegmentForm] = useState({
    type: 'L2' as 'L2' | 'L3',
    name: '',
    network: '',
    mask: '255.255.255.0'
  });

  const [packetForm, setPacketForm] = useState({
    sourceId: '',
    destinationId: '',
    type: 'ICMP' as 'ICMP' | 'ARP' | 'DATA'
  });

  const handleAddDevice = () => {
    if (!deviceForm.name) {
      alert('デバイス名を入力してください');
      return;
    }

    if (deviceForm.ipAddress && !validateIpAddress(deviceForm.ipAddress)) {
      alert('正しいIPアドレスを入力してください');
      return;
    }

    const newDevice: NetworkDevice = {
      id: generateDeviceId(),
      name: deviceForm.name,
      type: deviceForm.type,
      position: { x: Math.random() * 800 + 100, y: Math.random() * 400 + 100 },
      macAddress: generateMacAddress(),
      ipAddress: deviceForm.ipAddress || undefined,
      subnetMask: deviceForm.subnetMask || undefined,
      defaultGateway: deviceForm.defaultGateway || undefined,
      arpTable: {},
      routingTable: deviceForm.type === 'router' ? [] : undefined,
      ports: [] // This will be populated by the hook
    };

    onAddDevice(newDevice);
    setDeviceForm({
      name: '',
      type: 'client',
      ipAddress: '',
      subnetMask: '255.255.255.0',
      defaultGateway: ''
    });
  };

  const handleCreateSegment = () => {
    if (!segmentForm.name) {
      alert('セグメント名を入力してください');
      return;
    }

    if (segmentForm.type === 'L3') {
      if (!segmentForm.network || !validateIpAddress(segmentForm.network)) {
        alert('正しいネットワークアドレスを入力してください');
        return;
      }
      if (!segmentForm.mask || !validateIpAddress(segmentForm.mask)) {
        alert('正しいサブネットマスクを入力してください');
        return;
      }
    }

    onCreateSegment(
      segmentForm.type,
      segmentForm.name,
      segmentForm.network || undefined,
      segmentForm.mask || undefined
    );

    setSegmentForm({
      type: 'L2',
      name: '',
      network: '',
      mask: '255.255.255.0'
    });
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
          <input
            type="text"
            placeholder="デバイス名"
            value={deviceForm.name}
            onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
          />
          <select
            value={deviceForm.type}
            onChange={(e) => setDeviceForm({ ...deviceForm, type: e.target.value as any })}
          >
            <option value="client">クライアント</option>
            <option value="router">ルーター</option>
            <option value="switch">スイッチ</option>
          </select>
          <input
            type="text"
            placeholder="IPアドレス (オプション)"
            value={deviceForm.ipAddress}
            onChange={(e) => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })}
          />
          <input
            type="text"
            placeholder="サブネットマスク"
            value={deviceForm.subnetMask}
            onChange={(e) => setDeviceForm({ ...deviceForm, subnetMask: e.target.value })}
          />
          <input
            type="text"
            placeholder="デフォルトゲートウェイ (オプション)"
            value={deviceForm.defaultGateway}
            onChange={(e) => setDeviceForm({ ...deviceForm, defaultGateway: e.target.value })}
          />
          <button onClick={handleAddDevice}>デバイス追加</button>
        </div>
      </div>

      <div className="panel-section">
        <h4>セグメント作成</h4>
        <div className="form-group">
          <select
            value={segmentForm.type}
            onChange={(e) => setSegmentForm({ ...segmentForm, type: e.target.value as 'L2' | 'L3' })}
          >
            <option value="L2">L2セグメント</option>
            <option value="L3">L3セグメント</option>
          </select>
          <input
            type="text"
            placeholder="セグメント名"
            value={segmentForm.name}
            onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
          />
          {segmentForm.type === 'L3' && (
            <>
              <input
                type="text"
                placeholder="ネットワークアドレス"
                value={segmentForm.network}
                onChange={(e) => setSegmentForm({ ...segmentForm, network: e.target.value })}
              />
              <input
                type="text"
                placeholder="サブネットマスク"
                value={segmentForm.mask}
                onChange={(e) => setSegmentForm({ ...segmentForm, mask: e.target.value })}
              />
            </>
          )}
          <button onClick={handleCreateSegment}>セグメント作成</button>
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
            {devices.map(device => (
              <option key={device.id} value={device.id}>
                {device.name} ({device.ipAddress || 'IP未設定'})
              </option>
            ))}
          </select>
          <select
            value={packetForm.destinationId}
            onChange={(e) => setPacketForm({ ...packetForm, destinationId: e.target.value })}
          >
            <option value="">宛先を選択</option>
            {devices.map(device => (
              <option key={device.id} value={device.id}>
                {device.name} ({device.ipAddress || 'IP未設定'})
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

      <div className="panel-section">
        <h4>学習ヒント</h4>
        <div className="hints">
          <p>• <strong>L2セグメント</strong>: 同じスイッチに接続されたデバイス群</p>
          <p>• <strong>L3セグメント</strong>: 同じサブネットのデバイス群</p>
          <p>• <strong>ARP</strong>: IPアドレスからMACアドレスを解決</p>
          <p>• <strong>ルーティング</strong>: 異なるセグメント間の通信</p>
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