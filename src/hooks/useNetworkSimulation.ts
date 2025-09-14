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
  createDefaultPorts,
  getNetworkAddress
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
    simulationSpeed: 1,
    pingResults: []
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
      connections: prev.connections.filter(conn =>
        conn.fromDeviceId !== deviceId && conn.toDeviceId !== deviceId
      ),
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

  // Simple path finding function using breadth-first search
  const findPath = useCallback((sourceId: string, destinationId: string): string[] => {
    const visited = new Set<string>();
    const queue: { deviceId: string; path: string[] }[] = [{ deviceId: sourceId, path: [sourceId] }];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.deviceId === destinationId) {
        return current.path;
      }

      if (visited.has(current.deviceId)) continue;
      visited.add(current.deviceId);

      // Find connected devices
      const connectedDevices = state.connections
        .filter(conn =>
          (conn.fromDeviceId === current.deviceId || conn.toDeviceId === current.deviceId) &&
          conn.status === 'connected'
        )
        .map(conn => conn.fromDeviceId === current.deviceId ? conn.toDeviceId : conn.fromDeviceId);

      for (const connectedId of connectedDevices) {
        if (!visited.has(connectedId)) {
          queue.push({
            deviceId: connectedId,
            path: [...current.path, connectedId]
          });
        }
      }
    }

    return [sourceId, destinationId]; // Fallback to direct path
  }, [state.connections]);

  // Helper function to check if two devices are in the same L2 segment
  const isInSameL2Segment = useCallback((device1Id: string, device2Id: string): boolean => {
    const path = findPath(device1Id, device2Id);

    // Check if path contains any routers (L3 devices)
    for (let i = 1; i < path.length - 1; i++) {
      const intermediateDevice = state.devices.find(d => d.id === path[i]);
      if (intermediateDevice?.type === 'router') {
        return false; // Router found, different L2 segments
      }
    }
    return true; // No routers in path, same L2 segment
  }, [state.devices, findPath]);

  // Helper function to find next hop for L3 routing
  const findNextHop = useCallback((sourceId: string, destinationIP: string) => {
    const sourceDevice = state.devices.find(d => d.id === sourceId);
    if (!sourceDevice || !sourceDevice.ipAddress || !sourceDevice.subnetMask) return null;

    // Check if destination is in same subnet (L2 reachable)
    const sourceNetwork = getNetworkAddress(sourceDevice.ipAddress, sourceDevice.subnetMask);
    const destNetwork = getNetworkAddress(destinationIP, sourceDevice.subnetMask);

    if (sourceNetwork === destNetwork) {
      // Same L2 segment - destination is directly reachable
      return { nextHopIP: destinationIP, isDirectlyReachable: true };
    }

    // Different L2 segment - need to find default gateway (router)
    const path = findPath(sourceId, ''); // Find any connected router
    for (let i = 1; i < path.length; i++) {
      const device = state.devices.find(d => d.id === path[i]);
      if (device?.type === 'router' && device.ipAddress) {
        return { nextHopIP: device.ipAddress, isDirectlyReachable: false };
      }
    }

    return null;
  }, [state.devices, findPath]);

  const sendPacket = useCallback((sourceId: string, destinationId: string, type: 'ICMP' | 'ARP' | 'DATA') => {
    const sourceDevice = state.devices.find(d => d.id === sourceId);
    const destinationDevice = state.devices.find(d => d.id === destinationId);

    if (!sourceDevice || !destinationDevice) {
      console.error('Source or destination device not found');
      return;
    }

    const destinationIP = destinationDevice.ipAddress || '';

    if (type === 'ICMP') {
      // For ICMP, we need to determine the next hop
      const nextHop = findNextHop(sourceId, destinationIP);

      if (!nextHop) {
        console.error(`No route to ${destinationIP} from ${sourceDevice.name}`);
        return;
      }

      const targetIP = nextHop.nextHopIP;

      // Check if we have ARP entry for the next hop
      if (!sourceDevice.arpTable[targetIP]) {
        console.log(`${sourceDevice.name} needs ARP resolution for next hop ${targetIP}`);

        // Find the device with this IP in the same L2 segment
        let arpTargetDevice = null;
        for (const device of state.devices) {
          if (device.ipAddress === targetIP && isInSameL2Segment(sourceId, device.id)) {
            arpTargetDevice = device;
            break;
          }
        }

        if (!arpTargetDevice) {
          console.error(`Cannot find ARP target for ${targetIP} in same L2 segment`);
          return;
        }

        // Send ARP request within the same L2 segment only
        const arpPath = findPath(sourceId, arpTargetDevice.id);
        const arpPacket: Packet = {
          id: generatePacketId(),
          sourceDeviceId: sourceId,
          destinationDeviceId: arpTargetDevice.id,
          sourceIP: sourceDevice.ipAddress || '',
          destinationIP: targetIP,
          sourceMac: sourceDevice.macAddress,
          destinationMac: 'FF:FF:FF:FF:FF:FF', // ARP broadcast
          type: 'ARP',
          status: 'sending',
          path: arpPath,
          currentPosition: 0,
          createdAt: Date.now(),
          // Store original ICMP info
          needsReply: true,
          replySourceId: sourceId,
          replyDestinationId: destinationId
        };

        setState(prev => ({
          ...prev,
          packets: [...prev.packets, arpPacket]
        }));
        return;
      }
    }

    const path = findPath(sourceId, destinationId);

    // For ICMP packets, use the resolved next hop MAC
    let destinationMac = destinationDevice.macAddress;
    if (type === 'ICMP') {
      const nextHop = findNextHop(sourceId, destinationIP);
      if (nextHop && sourceDevice.arpTable[nextHop.nextHopIP]) {
        destinationMac = sourceDevice.arpTable[nextHop.nextHopIP];
      }
    }

    const packet: Packet = {
      id: generatePacketId(),
      sourceDeviceId: sourceId,
      destinationDeviceId: destinationId,
      sourceIP: sourceDevice.ipAddress || '',
      destinationIP: destinationIP,
      sourceMac: sourceDevice.macAddress,
      destinationMac: destinationMac,
      type,
      status: 'sending',
      path,
      currentPosition: 0,
      createdAt: Date.now()
    };

    // Add response capability for ICMP packets
    if (type === 'ICMP') {
      packet.needsReply = true;
      packet.replySourceId = destinationId;
      packet.replyDestinationId = sourceId;
    }

    setState(prev => ({
      ...prev,
      packets: [...prev.packets, packet]
    }));
  }, [state.devices, findPath, isInSameL2Segment, findNextHop]);

  const clearSimulation = useCallback(() => {
    setState(prev => ({
      ...prev,
      packets: [],
      selectedDevice: null,
      selectedSegment: null,
      selectedConnection: null,
      pingResults: []
    }));
  }, []);

  // Preset loading functions
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

    pc1.ports[0].connectedTo = pc2.ports[0].id;
    pc2.ports[0].connectedTo = pc1.ports[0].id;

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
      arpTable: {},
      macTable: {}
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

    pc1.ports[0].connectedTo = switch1.ports[0].id;
    switch1.ports[0].connectedTo = pc1.ports[0].id;
    pc2.ports[0].connectedTo = switch1.ports[1].id;
    switch1.ports[1].connectedTo = pc2.ports[0].id;

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
      arpTable: {},
      macTable: {}
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

    const connections: Connection[] = [
      {
        id: generateConnectionId(),
        fromDeviceId: pc1Id,
        fromPortId: pc1.ports[0].id,
        toDeviceId: switchId,
        toPortId: switch1.ports[0].id,
        type: 'ethernet',
        status: 'connected'
      },
      {
        id: generateConnectionId(),
        fromDeviceId: pc2Id,
        fromPortId: pc2.ports[0].id,
        toDeviceId: switchId,
        toPortId: switch1.ports[1].id,
        type: 'ethernet',
        status: 'connected'
      },
      {
        id: generateConnectionId(),
        fromDeviceId: switchId,
        fromPortId: switch1.ports[2].id,
        toDeviceId: routerId,
        toPortId: router1.ports[0].id,
        type: 'ethernet',
        status: 'connected'
      },
      {
        id: generateConnectionId(),
        fromDeviceId: routerId,
        fromPortId: router1.ports[1].id,
        toDeviceId: pc3Id,
        toPortId: pc3.ports[0].id,
        type: 'ethernet',
        status: 'connected'
      }
    ];

    // Update port connections
    pc1.ports[0].connectedTo = switch1.ports[0].id;
    switch1.ports[0].connectedTo = pc1.ports[0].id;
    pc2.ports[0].connectedTo = switch1.ports[1].id;
    switch1.ports[1].connectedTo = pc2.ports[0].id;
    switch1.ports[2].connectedTo = router1.ports[0].id;
    router1.ports[0].connectedTo = switch1.ports[2].id;
    router1.ports[1].connectedTo = pc3.ports[0].id;
    pc3.ports[0].connectedTo = router1.ports[1].id;

    setState(prev => ({
      ...prev,
      devices: [pc1, pc2, switch1, router1, pc3],
      connections
    }));
  }, []);

  const loadPreset = useCallback((presetName: string) => {
    setState(prev => ({
      ...prev,
      devices: [],
      segments: [],
      packets: [],
      connections: [],
      selectedDevice: null,
      selectedSegment: null,
      selectedConnection: null,
      connectionMode: false,
      pingResults: []
    }));

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
    }, 50);
  }, [loadDirectPCsPreset, loadPCsSwitchPreset, loadNetworkWithRouterPreset]);

  const selectDevice = useCallback((deviceId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedDevice: deviceId,
      selectedSegment: null,
      selectedConnection: null
    }));
  }, []);

  const selectSegment = useCallback((segmentId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedSegment: segmentId,
      selectedDevice: null,
      selectedConnection: null
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

  const setSimulationSpeed = useCallback((speed: number) => {
    setState(prev => ({
      ...prev,
      simulationSpeed: speed
    }));
  }, []);

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

  const handleDeviceClickForConnection = useCallback((deviceId: string, portId?: string) => {
    if (!state.connectionMode) {
      selectDevice(deviceId);
      return;
    }

    const device = state.devices.find(d => d.id === deviceId);
    if (!device) return;

    const availablePort = portId
      ? device.ports.find(p => p.id === portId)
      : device.ports.find(p => !p.connectedTo);

    if (!availablePort) {
      console.warn('No available ports on device');
      return;
    }

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
    setState(prev => ({
      ...prev,
      selectedDevice: null,
      selectedSegment: null,
      selectedConnection: null
    }));
  }, []);

  // Simplified packet processing effect
  useEffect(() => {
    if (state.packets.length === 0) return;

    const interval = setInterval(() => {
      setState(prev => {
        const newPackets: Packet[] = [];

        const updatedDevices = [...prev.devices];

        const remainingPackets = prev.packets.filter(packet => {
          const timeSinceCreated = Date.now() - packet.createdAt;
          const speed = 200 * prev.simulationSpeed;
          const distanceTraveled = (timeSinceCreated / 1000) * speed;

          // Calculate total path distance
          let totalDistance = 0;
          for (let i = 0; i < packet.path.length - 1; i++) {
            const fromDevice = prev.devices.find(d => d.id === packet.path[i]);
            const toDevice = prev.devices.find(d => d.id === packet.path[i + 1]);
            if (fromDevice && toDevice) {
              const dx = toDevice.position.x - fromDevice.position.x;
              const dy = toDevice.position.y - fromDevice.position.y;
              totalDistance += Math.sqrt(dx * dx + dy * dy);
            }
          }

          const hasReachedDestination = distanceTraveled >= totalDistance;

          // Router processing - handle L2/L3 boundary correctly
          packet.path.forEach((deviceId, index) => {
            const device = updatedDevices.find(d => d.id === deviceId);

            if (device && device.type === 'router' && index > 0 && index < packet.path.length - 1) {
              const prevDeviceId = packet.path[index - 1];
              const nextDeviceId = packet.path[index + 1];
              const prevDevice = updatedDevices.find(d => d.id === prevDeviceId);
              const nextDevice = updatedDevices.find(d => d.id === nextDeviceId);

              const routerIndex = updatedDevices.findIndex(d => d.id === device.id);
              if (routerIndex !== -1) {
                const updatedArpTable = { ...updatedDevices[routerIndex].arpTable };

                // Router learns source MAC on input interface (L2 learning)
                if (prevDevice && packet.sourceIP && prevDevice.type !== 'router') {
                  updatedArpTable[packet.sourceIP] = prevDevice.macAddress;
                  console.log(`Router ${device.name} learned ARP: ${packet.sourceIP} -> ${prevDevice.macAddress} (input side)`);
                }

                // For output interface, router needs ARP entry for next hop
                if (nextDevice && packet.type === 'ICMP') {
                  // If next device is not a router, router needs its MAC
                  if (nextDevice.type !== 'router' && nextDevice.ipAddress) {
                    // Check if router already has ARP entry for next hop
                    if (!updatedArpTable[nextDevice.ipAddress]) {
                      console.log(`Router ${device.name} needs ARP for ${nextDevice.ipAddress} on output interface`);
                      // In a real implementation, router would send ARP request here
                      // For simulation, we'll learn it directly
                      updatedArpTable[nextDevice.ipAddress] = nextDevice.macAddress;
                      console.log(`Router ${device.name} learned ARP: ${nextDevice.ipAddress} -> ${nextDevice.macAddress} (output side)`);
                    }

                    // Update packet MAC addresses for L3 -> L2 forwarding
                    packet.sourceMac = device.macAddress; // Router becomes source at L2
                    packet.destinationMac = nextDevice.macAddress; // Next hop MAC
                  }
                }

                updatedDevices[routerIndex] = {
                  ...updatedDevices[routerIndex],
                  arpTable: updatedArpTable
                };
              }
            }
          });

          // Handle ARP response and auto-trigger ICMP packet
          if (hasReachedDestination && packet.type === 'ARP') {
            const sourceDevice = updatedDevices.find(d => d.id === packet.sourceDeviceId);
            const targetDevice = updatedDevices.find(d => d.id === packet.destinationDeviceId);

            if (sourceDevice && targetDevice && targetDevice.ipAddress) {
              // Update ARP table with resolved MAC address
              const sourceIndex = updatedDevices.findIndex(d => d.id === packet.sourceDeviceId);
              if (sourceIndex !== -1) {
                updatedDevices[sourceIndex] = {
                  ...sourceDevice,
                  arpTable: {
                    ...sourceDevice.arpTable,
                    [targetDevice.ipAddress]: targetDevice.macAddress
                  }
                };

                console.log(`${sourceDevice.name} learned ARP: ${targetDevice.ipAddress} -> ${targetDevice.macAddress}`);

                // Auto-send the original ICMP packet after ARP resolution
                if (packet.needsReply && packet.replySourceId && packet.replyDestinationId) {
                  const icmpPath = findPath(packet.replySourceId, packet.replyDestinationId);
                  const icmpPacket: Packet = {
                    id: `icmp-after-arp-${Date.now()}`,
                    sourceDeviceId: packet.replySourceId,
                    destinationDeviceId: packet.replyDestinationId,
                    sourceIP: sourceDevice.ipAddress || '',
                    destinationIP: targetDevice.ipAddress,
                    sourceMac: sourceDevice.macAddress,
                    destinationMac: targetDevice.macAddress, // Now we have the resolved MAC
                    type: 'ICMP',
                    status: 'sending',
                    path: icmpPath,
                    currentPosition: 0,
                    createdAt: Date.now() + 200, // Small delay after ARP
                    needsReply: true,
                    replySourceId: packet.replyDestinationId,
                    replyDestinationId: packet.replySourceId
                  };
                  newPackets.push(icmpPacket);
                  console.log(`${sourceDevice.name} sending ICMP after ARP resolution`);
                }
              }
            }
          }

          // Generate reply for ICMP packets when they reach destination
          if (hasReachedDestination && packet.type === 'ICMP' && packet.needsReply &&
              packet.replySourceId && packet.replyDestinationId && !packet.isReply) {

            const replyId = `reply-${packet.id}`;
            const replyExists = prev.packets.some(p => p.id === replyId) ||
                              newPackets.some(p => p.id === replyId);

            if (!replyExists) {
              const replyPath = findPath(packet.replySourceId, packet.replyDestinationId);
              const replyPacket: Packet = {
                id: replyId,
                sourceDeviceId: packet.replySourceId,
                destinationDeviceId: packet.replyDestinationId,
                sourceIP: packet.destinationIP,
                destinationIP: packet.sourceIP,
                sourceMac: packet.destinationMac,
                destinationMac: packet.sourceMac,
                type: 'ICMP',
                status: 'sending',
                path: replyPath,
                currentPosition: 0,
                createdAt: Date.now() + 100,
                isReply: true
              };
              newPackets.push(replyPacket);
            }
          }

          // Update packet position for animation
          if (!hasReachedDestination) {
            packet.currentPosition = Math.min(distanceTraveled / totalDistance, 1);
          }

          // Keep packet if it hasn't reached the end (with small buffer)
          return distanceTraveled < totalDistance + 50;
        });

        return {
          ...prev,
          devices: updatedDevices,
          packets: [...remainingPackets, ...newPackets]
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [state.packets.length, state.simulationSpeed, findPath]);

  // Auto-assign devices to segments based on IP addresses
  useEffect(() => {
    setState(prev => {
      const updatedSegments = prev.segments.map(segment => {
        if (segment.type === 'L3' && segment.network && segment.mask) {
          const devicesInSegment = prev.devices
            .filter(device =>
              device.ipAddress &&
              device.subnetMask &&
              isInSameSubnet(device.ipAddress, segment.network!, segment.mask!)
            )
            .map(device => device.id);

          return { ...segment, devices: devicesInSegment };
        }
        return segment;
      });

      return { ...prev, segments: updatedSegments };
    });
  }, [state.devices]);

  // Return all required properties and functions
  return {
    devices: state.devices,
    segments: state.segments,
    packets: state.packets,
    connections: state.connections,
    selectedDevice: state.selectedDevice,
    selectedSegment: state.selectedSegment,
    selectedConnection: state.selectedConnection,
    selectedDeviceData: state.selectedDevice
      ? state.devices.find(d => d.id === state.selectedDevice) || null
      : null,
    selectedSegmentData: state.selectedSegment
      ? state.segments.find(s => s.id === state.selectedSegment) || null
      : null,
    selectedConnectionData: state.selectedConnection
      ? state.connections.find(c => c.id === state.selectedConnection) || null
      : null,
    connectionMode: state.connectionMode,
    simulationSpeed: state.simulationSpeed,
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
  };
};