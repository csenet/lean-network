import { useState, useCallback, useEffect } from 'react';
import { NetworkState, NetworkDevice, NetworkSegment, Packet, Connection } from '../types/network';
import {
  generateSegmentId,
  generatePacketId,
  generateConnectionId,
  generateDeviceId,
  generateMacAddress,
  getSubnetColors,
  isInSameSubnet,
  createDefaultPorts
} from '../utils/networkUtils';

export const useNetworkSimulation = () => {
  const [state, setState] = useState<NetworkState>({
    devices: [],
    segments: [],
    packets: [],
    connections: [],
    selectedDevice: null,
    selectedSegment: null,
    selectedConnection: null,
    connectionMode: false,
    simulationSpeed: 1
  });

  const addDevice = useCallback((device: NetworkDevice) => {
    const deviceWithPorts = {
      ...device,
      ports: createDefaultPorts(device.type)
    };
    setState(prev => ({
      ...prev,
      devices: [...prev.devices, deviceWithPorts]
    }));
  }, []);

  const updateDevice = useCallback((updatedDevice: NetworkDevice) => {
    setState(prev => ({
      ...prev,
      devices: prev.devices.map(device =>
        device.id === updatedDevice.id ? updatedDevice : device
      )
    }));
  }, []);

  const updateDevicePosition = useCallback((deviceId: string, newPosition: { x: number; y: number }) => {
    setState(prev => ({
      ...prev,
      devices: prev.devices.map(device =>
        device.id === deviceId ? { ...device, position: newPosition } : device
      )
    }));
  }, []);

  const deleteDevice = useCallback((deviceId: string) => {
    setState(prev => ({
      ...prev,
      devices: prev.devices.filter(device => device.id !== deviceId),
      segments: prev.segments.map(segment => ({
        ...segment,
        devices: segment.devices.filter(id => id !== deviceId)
      })),
      selectedDevice: prev.selectedDevice === deviceId ? null : prev.selectedDevice
    }));
  }, []);

  const createSegment = useCallback((type: 'L2' | 'L3', name: string, network?: string, mask?: string) => {
    const colors = getSubnetColors();
    const usedColors = state.segments.map(s => s.color);
    const availableColors = colors.filter(color => !usedColors.includes(color));
    const segmentColor = availableColors[0] || colors[0];

    const newSegment: NetworkSegment = {
      id: generateSegmentId(),
      type,
      name,
      network,
      mask,
      devices: [],
      color: segmentColor
    };

    setState(prev => ({
      ...prev,
      segments: [...prev.segments, newSegment]
    }));
  }, [state.segments]);

  const addDeviceToSegment = useCallback((deviceId: string, segmentId: string) => {
    setState(prev => ({
      ...prev,
      segments: prev.segments.map(segment =>
        segment.id === segmentId
          ? { ...segment, devices: Array.from(new Set([...segment.devices, deviceId])) }
          : segment
      )
    }));
  }, []);

  const removeDeviceFromSegment = useCallback((deviceId: string, segmentId: string) => {
    setState(prev => ({
      ...prev,
      segments: prev.segments.map(segment =>
        segment.id === segmentId
          ? { ...segment, devices: segment.devices.filter(id => id !== deviceId) }
          : segment
      )
    }));
  }, []);

  const autoAssignToSegments = useCallback(() => {
    setState(prev => {
      const newSegments = prev.segments.map(segment => ({ ...segment, devices: [] as string[] }));
      
      // Auto-assign devices to L3 segments based on IP addresses
      prev.devices.forEach(device => {
        if (device.ipAddress && device.subnetMask) {
          const matchingSegment = newSegments.find(segment =>
            segment.type === 'L3' &&
            segment.network &&
            segment.mask &&
            isInSameSubnet(device.ipAddress!, segment.network, segment.mask)
          );
          
          if (matchingSegment) {
            matchingSegment.devices.push(device.id);
          }
        }
      });

      return {
        ...prev,
        segments: newSegments
      };
    });
  }, []);

  const updateArpTable = useCallback((device: NetworkDevice, ip: string, mac: string) => {
    const updatedDevice = {
      ...device,
      arpTable: {
        ...device.arpTable,
        [ip]: mac
      }
    };
    updateDevice(updatedDevice);
  }, [updateDevice]);

  const sendPacket = useCallback((sourceId: string, destinationId: string, type: 'ICMP' | 'ARP' | 'DATA') => {
    const sourceDevice = state.devices.find(d => d.id === sourceId);
    const destinationDevice = state.devices.find(d => d.id === destinationId);

    if (!sourceDevice || !destinationDevice) {
      console.error('Source or destination device not found');
      return;
    }

    // Simple path finding - in reality this would involve routing logic
    const path = [sourceId, destinationId];

    const packet: Packet = {
      id: generatePacketId(),
      sourceDeviceId: sourceId,
      destinationDeviceId: destinationId,
      sourceIP: sourceDevice.ipAddress || '',
      destinationIP: destinationDevice.ipAddress || '',
      sourceMac: sourceDevice.macAddress,
      destinationMac: destinationDevice.macAddress,
      type,
      status: 'sending',
      path,
      currentPosition: 0,
      createdAt: Date.now()
    };

    // Simulate ARP resolution if needed
    if (type !== 'ARP' && sourceDevice.ipAddress && destinationDevice.ipAddress) {
      updateArpTable(sourceDevice, destinationDevice.ipAddress, destinationDevice.macAddress);
    }

    setState(prev => ({
      ...prev,
      packets: [...prev.packets, packet]
    }));
  }, [state.devices, updateArpTable]);

  const clearSimulation = useCallback(() => {
    setState(prev => ({
      ...prev,
      packets: [],
      selectedDevice: null,
      selectedSegment: null
    }));
  }, []);

  const loadDirectPCsPreset = useCallback(() => {
    const pc1Id = generateDeviceId();
    const pc2Id = generateDeviceId();

    const pc1: NetworkDevice = {
      id: pc1Id,
      name: 'PC1',
      type: 'client',
      position: { x: 200, y: 300 },
      macAddress: generateMacAddress(),
      ipAddress: '192.168.1.10',
      subnetMask: '255.255.255.0',
      ports: createDefaultPorts('client'),
      arpTable: {}
    };

    const pc2: NetworkDevice = {
      id: pc2Id,
      name: 'PC2',
      type: 'client',
      position: { x: 600, y: 300 },
      macAddress: generateMacAddress(),
      ipAddress: '192.168.1.11',
      subnetMask: '255.255.255.0',
      ports: createDefaultPorts('client'),
      arpTable: {}
    };

    const connection: Connection = {
      id: generateConnectionId(),
      fromDeviceId: pc1Id,
      fromPortId: pc1.ports[0].id,
      toDeviceId: pc2Id,
      toPortId: pc2.ports[0].id,
      type: 'ethernet',
      status: 'connected'
    };

    setState(prev => ({
      ...prev,
      devices: [pc1, pc2],
      connections: [connection]
    }));
  }, []);

  const loadPCsSwitchPreset = useCallback(() => {
    const pc1Id = generateDeviceId();
    const pc2Id = generateDeviceId();
    const switchId = generateDeviceId();

    const pc1: NetworkDevice = {
      id: pc1Id,
      name: 'PC1',
      type: 'client',
      position: { x: 150, y: 200 },
      macAddress: generateMacAddress(),
      ipAddress: '192.168.1.10',
      subnetMask: '255.255.255.0',
      ports: createDefaultPorts('client'),
      arpTable: {}
    };

    const pc2: NetworkDevice = {
      id: pc2Id,
      name: 'PC2',
      type: 'client',
      position: { x: 650, y: 200 },
      macAddress: generateMacAddress(),
      ipAddress: '192.168.1.11',
      subnetMask: '255.255.255.0',
      ports: createDefaultPorts('client'),
      arpTable: {}
    };

    const switch1: NetworkDevice = {
      id: switchId,
      name: 'Switch1',
      type: 'switch',
      position: { x: 400, y: 300 },
      macAddress: generateMacAddress(),
      ports: createDefaultPorts('switch'),
      arpTable: {}
    };

    const connection1: Connection = {
      id: generateConnectionId(),
      fromDeviceId: pc1Id,
      fromPortId: pc1.ports[0].id,
      toDeviceId: switchId,
      toPortId: switch1.ports[0].id,
      type: 'ethernet',
      status: 'connected'
    };

    const connection2: Connection = {
      id: generateConnectionId(),
      fromDeviceId: pc2Id,
      fromPortId: pc2.ports[0].id,
      toDeviceId: switchId,
      toPortId: switch1.ports[1].id,
      type: 'ethernet',
      status: 'connected'
    };

    setState(prev => ({
      ...prev,
      devices: [pc1, pc2, switch1],
      connections: [connection1, connection2]
    }));
  }, []);

  const loadNetworkWithRouterPreset = useCallback(() => {
    const pc1Id = generateDeviceId();
    const pc2Id = generateDeviceId();
    const pc3Id = generateDeviceId();
    const switchId = generateDeviceId();
    const routerId = generateDeviceId();

    const pc1: NetworkDevice = {
      id: pc1Id,
      name: 'PC1',
      type: 'client',
      position: { x: 100, y: 200 },
      macAddress: generateMacAddress(),
      ipAddress: '192.168.1.10',
      subnetMask: '255.255.255.0',
      defaultGateway: '192.168.1.1',
      ports: createDefaultPorts('client'),
      arpTable: {}
    };

    const pc2: NetworkDevice = {
      id: pc2Id,
      name: 'PC2',
      type: 'client',
      position: { x: 300, y: 200 },
      macAddress: generateMacAddress(),
      ipAddress: '192.168.1.11',
      subnetMask: '255.255.255.0',
      defaultGateway: '192.168.1.1',
      ports: createDefaultPorts('client'),
      arpTable: {}
    };

    const switch1: NetworkDevice = {
      id: switchId,
      name: 'Switch1',
      type: 'switch',
      position: { x: 200, y: 350 },
      macAddress: generateMacAddress(),
      ports: createDefaultPorts('switch'),
      arpTable: {}
    };

    const router1: NetworkDevice = {
      id: routerId,
      name: 'Router1',
      type: 'router',
      position: { x: 500, y: 350 },
      macAddress: generateMacAddress(),
      ipAddress: '192.168.1.1',
      subnetMask: '255.255.255.0',
      ports: createDefaultPorts('router'),
      arpTable: {},
      routingTable: [
        { network: '192.168.1.0', mask: '255.255.255.0', gateway: '0.0.0.0', interface: 'eth0' },
        { network: '192.168.2.0', mask: '255.255.255.0', gateway: '0.0.0.0', interface: 'eth1' }
      ]
    };

    const pc3: NetworkDevice = {
      id: pc3Id,
      name: 'PC3',
      type: 'client',
      position: { x: 700, y: 200 },
      macAddress: generateMacAddress(),
      ipAddress: '192.168.2.10',
      subnetMask: '255.255.255.0',
      defaultGateway: '192.168.2.1',
      ports: createDefaultPorts('client'),
      arpTable: {}
    };

    const connection1: Connection = {
      id: generateConnectionId(),
      fromDeviceId: pc1Id,
      fromPortId: pc1.ports[0].id,
      toDeviceId: switchId,
      toPortId: switch1.ports[0].id,
      type: 'ethernet',
      status: 'connected'
    };

    const connection2: Connection = {
      id: generateConnectionId(),
      fromDeviceId: pc2Id,
      fromPortId: pc2.ports[0].id,
      toDeviceId: switchId,
      toPortId: switch1.ports[1].id,
      type: 'ethernet',
      status: 'connected'
    };

    const connection3: Connection = {
      id: generateConnectionId(),
      fromDeviceId: switchId,
      fromPortId: switch1.ports[2].id,
      toDeviceId: routerId,
      toPortId: router1.ports[0].id,
      type: 'ethernet',
      status: 'connected'
    };

    const connection4: Connection = {
      id: generateConnectionId(),
      fromDeviceId: routerId,
      fromPortId: router1.ports[1].id,
      toDeviceId: pc3Id,
      toPortId: pc3.ports[0].id,
      type: 'ethernet',
      status: 'connected'
    };

    setState(prev => ({
      ...prev,
      devices: [pc1, pc2, switch1, router1, pc3],
      connections: [connection1, connection2, connection3, connection4]
    }));
  }, []);

  const loadPreset = useCallback((presetName: string) => {
    // Clear current state first
    setState({
      devices: [],
      segments: [],
      packets: [],
      connections: [],
      selectedDevice: null,
      selectedSegment: null,
      selectedConnection: null,
      connectionMode: false,
      simulationSpeed: 1
    });

    // Load specific preset
    setTimeout(() => {
      switch (presetName) {
        case 'direct-pcs':
          loadDirectPCsPreset();
          break;
        case 'pcs-switch':
          loadPCsSwitchPreset();
          break;
        case 'network-with-router':
          loadNetworkWithRouterPreset();
          break;
        default:
          console.warn('Unknown preset:', presetName);
      }
    }, 50); // Small delay to ensure state is cleared
  }, [loadDirectPCsPreset, loadPCsSwitchPreset, loadNetworkWithRouterPreset]);

  const selectDevice = useCallback((deviceId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedDevice: deviceId,
      selectedSegment: null
    }));
  }, []);

  const selectSegment = useCallback((segmentId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedSegment: segmentId,
      selectedDevice: null
    }));
  }, []);

  const setSimulationSpeed = useCallback((speed: number) => {
    setState(prev => ({
      ...prev,
      simulationSpeed: speed
    }));
  }, []);

  // Connection management
  const createConnection = useCallback((fromDeviceId: string, fromPortId: string, toDeviceId: string, toPortId: string) => {
    const connection: Connection = {
      id: generateConnectionId(),
      fromDeviceId,
      fromPortId,
      toDeviceId,
      toPortId,
      type: 'ethernet',
      status: 'connected'
    };

    setState(prev => {
      // Update port connection status
      const updatedDevices = prev.devices.map(device => {
        if (device.id === fromDeviceId) {
          return {
            ...device,
            ports: device.ports.map(port =>
              port.id === fromPortId ? { ...port, connectedTo: toPortId } : port
            )
          };
        }
        if (device.id === toDeviceId) {
          return {
            ...device,
            ports: device.ports.map(port =>
              port.id === toPortId ? { ...port, connectedTo: fromPortId } : port
            )
          };
        }
        return device;
      });

      return {
        ...prev,
        devices: updatedDevices,
        connections: [...prev.connections, connection],
        connectionMode: false
      };
    });
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    setState(prev => {
      const connection = prev.connections.find(c => c.id === connectionId);
      if (!connection) return prev;

      // Update port connection status
      const updatedDevices = prev.devices.map(device => {
        if (device.id === connection.fromDeviceId || device.id === connection.toDeviceId) {
          return {
            ...device,
            ports: device.ports.map(port => {
              if (port.id === connection.fromPortId || port.id === connection.toPortId) {
                return { ...port, connectedTo: undefined };
              }
              return port;
            })
          };
        }
        return device;
      });

      return {
        ...prev,
        devices: updatedDevices,
        connections: prev.connections.filter(c => c.id !== connectionId)
      };
    });
  }, []);

  const toggleConnectionMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      connectionMode: !prev.connectionMode,
      selectedDevice: null
    }));
  }, []);

  const selectConnection = useCallback((connectionId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedConnection: connectionId,
      selectedDevice: null,
      selectedSegment: null
    }));
  }, []);

  // Enhanced device selection for connection mode
  const handleDeviceClickForConnection = useCallback((deviceId: string, portId?: string) => {
    if (!state.connectionMode) {
      selectDevice(deviceId);
      return;
    }

    // Connection mode logic
    const device = state.devices.find(d => d.id === deviceId);
    if (!device) return;

    // Find available port if not specified
    const availablePort = portId ? device.ports.find(p => p.id === portId) : device.ports.find(p => !p.connectedTo);
    if (!availablePort) {
      alert('このデバイスに利用可能なポートがありません');
      return;
    }

    // Check if we have a selected device for connection
    if (state.selectedDevice && state.selectedDevice !== deviceId) {
      const fromDevice = state.devices.find(d => d.id === state.selectedDevice);
      const fromPort = fromDevice?.ports.find(p => !p.connectedTo);
      
      if (fromPort && fromDevice) {
        createConnection(fromDevice.id, fromPort.id, deviceId, availablePort.id);
      }
    } else {
      selectDevice(deviceId);
    }
  }, [state.connectionMode, state.selectedDevice, state.devices, selectDevice, createConnection]);

  const handleCanvasClick = useCallback((position: { x: number; y: number }) => {
    // If a segment is selected, we could potentially add a new device to it
    setState(prev => ({
      ...prev,
      selectedDevice: null,
      selectedSegment: null
    }));
  }, []);

  // Packet simulation loop
  useEffect(() => {
    if (state.packets.length === 0) return;

    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        packets: prev.packets.filter(packet => {
          if (packet.status === 'delivered' || packet.status === 'failed') {
            return false;
          }

          if (packet.currentPosition >= packet.path.length - 1) {
            return false; // Packet delivered
          }

          return true;
        }).map(packet => ({
          ...packet,
          currentPosition: Math.min(packet.currentPosition + 1, packet.path.length - 1),
          status: packet.currentPosition >= packet.path.length - 1 ? 'delivered' : packet.status
        }))
      }));
    }, 2000 / state.simulationSpeed);

    return () => clearInterval(interval);
  }, [state.packets.length, state.simulationSpeed]);

  // Auto-assign devices to segments when IP addresses change
  const devicesKey = state.devices.map(d => (d.ipAddress || '') + (d.subnetMask || '')).join(',');
  useEffect(() => {
    autoAssignToSegments();
  }, [devicesKey, autoAssignToSegments]);

  return {
    ...state,
    addDevice,
    updateDevice,
    updateDevicePosition,
    deleteDevice,
    createSegment,
    addDeviceToSegment,
    removeDeviceFromSegment,
    sendPacket,
    clearSimulation,
    loadPreset,
    selectDevice,
    selectSegment,
    selectConnection,
    setSimulationSpeed,
    handleCanvasClick,
    createConnection,
    removeConnection,
    toggleConnectionMode,
    handleDeviceClickForConnection,
    selectedDeviceData: state.selectedDevice ? state.devices.find(d => d.id === state.selectedDevice) || null : null,
    selectedSegmentData: state.selectedSegment ? state.segments.find(s => s.id === state.selectedSegment) || null : null,
    selectedConnectionData: state.selectedConnection ? state.connections.find(c => c.id === state.selectedConnection) || null : null
  };
};