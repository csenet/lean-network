import React, { useState } from 'react';
import { NetworkDevice, RoutingEntry } from '../types/network';

interface DevicePanelProps {
  device: NetworkDevice | null;
  onDeviceUpdate: (device: NetworkDevice) => void;
  onDeviceDelete: (deviceId: string) => void;
  onOpenTerminal?: () => void;
}

const DevicePanel: React.FC<DevicePanelProps> = ({
  device,
  onDeviceUpdate,
  onDeviceDelete,
  onOpenTerminal
}) => {
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null);
  const [editingRoutingEntry, setEditingRoutingEntry] = useState<RoutingEntry | null>(null);
  const [isAddingRoute, setIsAddingRoute] = useState(false);

  if (!device) {
    return (
      <div className="device-panel">
        <h3>デバイス情報</h3>
        <p>デバイスを選択してください</p>
      </div>
    );
  }

  const handleEdit = () => {
    setEditingDevice({ ...device });
  };

  const handleSave = () => {
    if (editingDevice) {
      onDeviceUpdate(editingDevice);
      setEditingDevice(null);
    }
  };

  const handleCancel = () => {
    setEditingDevice(null);
  };

  const handleInputChange = (field: keyof NetworkDevice, value: string) => {
    if (editingDevice) {
      setEditingDevice({
        ...editingDevice,
        [field]: value
      });
    }
  };

  const handleAddRoute = () => {
    setEditingRoutingEntry({
      network: '',
      mask: '255.255.255.0',
      gateway: '',
      interface: 'Port 1'
    });
    setIsAddingRoute(true);
  };

  const handleSaveRoute = () => {
    if (editingRoutingEntry && editingDevice) {
      const updatedRoutes = [...(editingDevice.routingTable || []), editingRoutingEntry];
      setEditingDevice({
        ...editingDevice,
        routingTable: updatedRoutes
      });
      setEditingRoutingEntry(null);
      setIsAddingRoute(false);
    }
  };

  const handleDeleteRoute = (index: number) => {
    if (editingDevice) {
      const updatedRoutes = (editingDevice.routingTable || []).filter((_, i) => i !== index);
      setEditingDevice({
        ...editingDevice,
        routingTable: updatedRoutes
      });
    }
  };

  const handleRouteInputChange = (field: keyof RoutingEntry, value: string) => {
    if (editingRoutingEntry) {
      setEditingRoutingEntry({
        ...editingRoutingEntry,
        [field]: value
      });
    }
  };

  const isEditing = editingDevice !== null;
  const displayDevice = editingDevice || device;

  return (
    <div className="device-panel">
      <h3>デバイス情報</h3>
      
      <div className="device-actions">
        <button 
          onClick={handleEdit}
          className="edit-button"
        >
          編集
        </button>
        <button 
          onClick={() => onDeviceDelete(device.id)}
          className="delete-button"
        >
          削除
        </button>
        {onOpenTerminal && (
          <button 
            onClick={onOpenTerminal}
            className="terminal-button"
          >
            🖥️ ターミナル
          </button>
        )}
      </div>

      <div className="device-info">
        <div className="info-row">
          <label>名前:</label>
          {isEditing ? (
            <input
              type="text"
              value={displayDevice.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          ) : (
            <span>{displayDevice.name}</span>
          )}
        </div>

        <div className="info-row">
          <label>タイプ:</label>
          {isEditing ? (
            <select
              value={displayDevice.type}
              onChange={(e) => handleInputChange('type', e.target.value as 'client' | 'router' | 'switch')}
            >
              <option value="client">クライアント</option>
              <option value="router">ルーター</option>
              <option value="switch">スイッチ</option>
            </select>
          ) : (
            <span>{getDeviceTypeLabel(displayDevice.type)}</span>
          )}
        </div>

        <div className="info-row">
          <label>MACアドレス:</label>
          <span>{displayDevice.macAddress}</span>
        </div>

        <div className="info-row">
          <label>IPアドレス:</label>
          {isEditing ? (
            <input
              type="text"
              value={displayDevice.ipAddress || ''}
              onChange={(e) => handleInputChange('ipAddress', e.target.value)}
              placeholder="192.168.1.1"
            />
          ) : (
            <span>{displayDevice.ipAddress || '未設定'}</span>
          )}
        </div>

        <div className="info-row">
          <label>サブネットマスク:</label>
          {isEditing ? (
            <input
              type="text"
              value={displayDevice.subnetMask || ''}
              onChange={(e) => handleInputChange('subnetMask', e.target.value)}
              placeholder="255.255.255.0"
            />
          ) : (
            <span>{displayDevice.subnetMask || '未設定'}</span>
          )}
        </div>

        <div className="info-row">
          <label>デフォルトゲートウェイ:</label>
          {isEditing ? (
            <input
              type="text"
              value={displayDevice.defaultGateway || ''}
              onChange={(e) => handleInputChange('defaultGateway', e.target.value)}
              placeholder="192.168.1.1"
            />
          ) : (
            <span>{displayDevice.defaultGateway || '未設定'}</span>
          )}
        </div>

        <div className="info-row">
          <label>座標:</label>
          <span>x: {displayDevice.position.x}, y: {displayDevice.position.y}</span>
        </div>
      </div>

      <div className="arp-table">
        <h4>ARPテーブル</h4>
        {Object.keys(displayDevice.arpTable).length === 0 ? (
          <p>エントリなし</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>IPアドレス</th>
                <th>MACアドレス</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(displayDevice.arpTable).map(([ip, mac]) => (
                <tr key={ip}>
                  <td>{ip}</td>
                  <td>{mac}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="ports-section">
        <h4>ポート情報</h4>
        {displayDevice.ports && displayDevice.ports.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ポート名</th>
                <th>状態</th>
                <th>接続先</th>
              </tr>
            </thead>
            <tbody>
              {displayDevice.ports.map((port) => (
                <tr key={port.id}>
                  <td>{port.name}</td>
                  <td>
                    <span className={`port-status ${port.status}`}>
                      {port.status === 'up' ? 'アップ' : 'ダウン'}
                    </span>
                  </td>
                  <td>{port.connectedTo ? '接続済み' : '未接続'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>ポートがありません</p>
        )}
      </div>

      {displayDevice.type === 'router' && (
        <div className="routing-table">
          <div className="routing-header">
            <h4>ルーティングテーブル</h4>
            {isEditing && (
              <button onClick={handleAddRoute} className="add-route-button">
                ルート追加
              </button>
            )}
          </div>
          
          {displayDevice.routingTable && displayDevice.routingTable.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ネットワーク</th>
                  <th>マスク</th>
                  <th>ゲートウェイ</th>
                  <th>インターフェース</th>
                  {isEditing && <th>操作</th>}
                </tr>
              </thead>
              <tbody>
                {displayDevice.routingTable.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.network}</td>
                    <td>{entry.mask}</td>
                    <td>{entry.gateway}</td>
                    <td>{entry.interface}</td>
                    {isEditing && (
                      <td>
                        <button 
                          onClick={() => handleDeleteRoute(index)}
                          className="delete-route-button"
                        >
                          削除
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>ルーティングエントリがありません</p>
          )}

          {isAddingRoute && editingRoutingEntry && (
            <div className="add-route-form">
              <h5>新しいルート</h5>
              <div className="route-inputs">
                <input
                  type="text"
                  placeholder="ネットワーク (例: 192.168.2.0)"
                  value={editingRoutingEntry.network}
                  onChange={(e) => handleRouteInputChange('network', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="サブネットマスク"
                  value={editingRoutingEntry.mask}
                  onChange={(e) => handleRouteInputChange('mask', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="ゲートウェイ (例: 192.168.1.1)"
                  value={editingRoutingEntry.gateway}
                  onChange={(e) => handleRouteInputChange('gateway', e.target.value)}
                />
                <select
                  value={editingRoutingEntry.interface}
                  onChange={(e) => handleRouteInputChange('interface', e.target.value)}
                >
                  {displayDevice.ports.map((port) => (
                    <option key={port.id} value={port.name}>
                      {port.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="route-buttons">
                <button onClick={handleSaveRoute} className="save-route-button">
                  保存
                </button>
                <button 
                  onClick={() => {
                    setIsAddingRoute(false);
                    setEditingRoutingEntry(null);
                  }}
                  className="cancel-route-button"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="button-group">
        {isEditing ? (
          <>
            <button onClick={handleSave} className="save-button">保存</button>
            <button onClick={handleCancel} className="cancel-button">キャンセル</button>
          </>
        ) : null}
      </div>
    </div>
  );
};

const getDeviceTypeLabel = (type: string): string => {
  switch (type) {
    case 'client': return 'クライアント';
    case 'router': return 'ルーター';
    case 'switch': return 'スイッチ';
    default: return type;
  }
};

export default DevicePanel;