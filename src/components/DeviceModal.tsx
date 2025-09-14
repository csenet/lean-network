import React, { useState, useEffect } from 'react';
import { NetworkDevice, RoutingEntry } from '../types/network';
import './DeviceModal.css';

interface DeviceModalProps {
  device: NetworkDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onDeviceUpdate: (device: NetworkDevice) => void;
  onDeviceDelete: (deviceId: string) => void;
}

const DeviceModal: React.FC<DeviceModalProps> = ({
  device,
  isOpen,
  onClose,
  onDeviceUpdate,
  onDeviceDelete
}) => {
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null);
  const [editingRoutingEntry, setEditingRoutingEntry] = useState<RoutingEntry | null>(null);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (device) {
      setEditingDevice({ ...device });
      setActiveTab('basic');
    }
  }, [device, device?.arpTable, device?.macTable]);

  if (!isOpen || !device || !editingDevice) return null;

  const handleSave = () => {
    if (editingDevice) {
      onDeviceUpdate(editingDevice);
      onClose();
    }
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
    setIsAddingRoute(true);
    setEditingRoutingEntry({
      network: '',
      mask: '255.255.255.0',
      gateway: '0.0.0.0',
      interface: editingDevice.ports[0]?.name || 'eth0'
    });
  };

  const handleRouteInputChange = (field: keyof RoutingEntry, value: string) => {
    if (editingRoutingEntry) {
      setEditingRoutingEntry({
        ...editingRoutingEntry,
        [field]: value
      });
    }
  };

  const handleSaveRoute = () => {
    if (editingDevice && editingRoutingEntry) {
      const updatedRoutingTable = [...(editingDevice.routingTable || []), editingRoutingEntry];
      setEditingDevice({
        ...editingDevice,
        routingTable: updatedRoutingTable
      });
      setIsAddingRoute(false);
      setEditingRoutingEntry(null);
    }
  };

  const handleDeleteRoute = (index: number) => {
    if (editingDevice && editingDevice.routingTable) {
      const updatedRoutingTable = editingDevice.routingTable.filter((_, i) => i !== index);
      setEditingDevice({
        ...editingDevice,
        routingTable: updatedRoutingTable
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`${device.name} を削除しますか？`)) {
      onDeviceDelete(device.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="device-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{device.name} の設定</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            基本設定
          </button>
          {device.type === 'router' && (
            <button
              className={`tab ${activeTab === 'routing' ? 'active' : ''}`}
              onClick={() => setActiveTab('routing')}
            >
              ルーティング
            </button>
          )}
          <button
            className={`tab ${activeTab === 'arp' ? 'active' : ''}`}
            onClick={() => setActiveTab('arp')}
          >
            {device.type === 'switch' ? 'MACテーブル' : 'ARP/MAC'}
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'basic' && (
            <div className="basic-settings">
              <div className="form-group">
                <label>デバイス名:</label>
                <input
                  type="text"
                  value={editingDevice.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>IPアドレス:</label>
                <input
                  type="text"
                  value={editingDevice.ipAddress || ''}
                  onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                  placeholder="192.168.1.1"
                />
              </div>

              <div className="form-group">
                <label>サブネットマスク:</label>
                <input
                  type="text"
                  value={editingDevice.subnetMask || ''}
                  onChange={(e) => handleInputChange('subnetMask', e.target.value)}
                  placeholder="255.255.255.0"
                />
              </div>

              {device.type === 'client' && (
                <div className="form-group">
                  <label>デフォルトゲートウェイ:</label>
                  <input
                    type="text"
                    value={editingDevice.defaultGateway || ''}
                    onChange={(e) => handleInputChange('defaultGateway', e.target.value)}
                    placeholder="192.168.1.1"
                  />
                </div>
              )}

              <div className="form-group">
                <label>MACアドレス:</label>
                <input
                  type="text"
                  value={editingDevice.macAddress}
                  onChange={(e) => handleInputChange('macAddress', e.target.value)}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="ports-section">
                <h4>ポート情報</h4>
                {editingDevice.ports && editingDevice.ports.length > 0 ? (
                  <div className="ports-grid">
                    {editingDevice.ports.map((port) => (
                      <div key={port.id} className="port-info">
                        <span className="port-name">{port.name}</span>
                        <span className={`port-status ${port.connectedTo ? 'connected' : 'disconnected'}`}>
                          {port.connectedTo ? '接続済み' : '未接続'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>ポートがありません</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'routing' && device.type === 'router' && (
            <div className="routing-settings">
              <div className="routing-header">
                <h4>ルーティングテーブル</h4>
                <button onClick={handleAddRoute} className="add-button">
                  + ルート追加
                </button>
              </div>

              {editingDevice.routingTable && editingDevice.routingTable.length > 0 ? (
                <div className="routing-table">
                  {editingDevice.routingTable.map((entry, index) => (
                    <div key={index} className="routing-entry">
                      <div className="entry-info">
                        <span><strong>宛先:</strong> {entry.network}/{entry.mask}</span>
                        <span><strong>ゲートウェイ:</strong> {entry.gateway}</span>
                        <span><strong>インターフェース:</strong> {entry.interface}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteRoute(index)}
                        className="delete-button"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>ルーティングエントリがありません</p>
              )}

              {isAddingRoute && editingRoutingEntry && (
                <div className="add-route-form">
                  <h5>新しいルート</h5>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>ネットワーク:</label>
                      <input
                        type="text"
                        placeholder="192.168.2.0"
                        value={editingRoutingEntry.network}
                        onChange={(e) => handleRouteInputChange('network', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>サブネットマスク:</label>
                      <input
                        type="text"
                        value={editingRoutingEntry.mask}
                        onChange={(e) => handleRouteInputChange('mask', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>ゲートウェイ:</label>
                      <input
                        type="text"
                        placeholder="192.168.1.1"
                        value={editingRoutingEntry.gateway}
                        onChange={(e) => handleRouteInputChange('gateway', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>インターフェース:</label>
                      <select
                        value={editingRoutingEntry.interface}
                        onChange={(e) => handleRouteInputChange('interface', e.target.value)}
                      >
                        {editingDevice.ports.map((port) => (
                          <option key={port.id} value={port.name}>
                            {port.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-buttons">
                    <button onClick={handleSaveRoute} className="save-button">
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingRoute(false);
                        setEditingRoutingEntry(null);
                      }}
                      className="cancel-button"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'arp' && (
            <div className="arp-settings">
              {editingDevice.type !== 'switch' && (
                <>
                  <h4>ARPテーブル</h4>
                  {Object.keys(editingDevice.arpTable).length === 0 ? (
                    <p>エントリなし</p>
                  ) : (
                    <div className="arp-table">
                      {Object.entries(editingDevice.arpTable).map(([ip, mac]) => (
                        <div key={ip} className="arp-entry">
                          <span><strong>IP:</strong> {ip}</span>
                          <span><strong>MAC:</strong> {mac}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {editingDevice.type === 'switch' && editingDevice.macTable && (
                <>
                  <h4>MACアドレステーブル</h4>
                  {Object.keys(editingDevice.macTable).length === 0 ? (
                    <p>エントリなし</p>
                  ) : (
                    <div className="mac-table">
                      {Object.entries(editingDevice.macTable).map(([mac, portId]) => {
                        // Find the port to get a simple port number
                        const port = editingDevice.ports.find(p => p.id === portId);
                        const portNumber = port ? port.name.replace('Port ', '') : '?';

                        return (
                          <div key={mac} className="mac-entry">
                            <span><strong>MAC:</strong> {mac}</span>
                            <span><strong>Port:</strong> {portNumber}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={handleDelete} className="delete-device-button">
            デバイス削除
          </button>
          <div className="footer-buttons">
            <button onClick={onClose} className="cancel-button">
              キャンセル
            </button>
            <button onClick={handleSave} className="save-button">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceModal;