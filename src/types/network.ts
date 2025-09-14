export interface DevicePort {
  id: string;
  name: string;
  status: 'up' | 'down';
  connectedTo?: string; // Connected device port ID
}

export interface NetworkDevice {
  id: string;
  name: string;
  type: 'client' | 'router' | 'switch';
  position: { x: number; y: number };
  macAddress: string;
  ipAddress?: string;
  subnetMask?: string;
  defaultGateway?: string;
  arpTable: Record<string, string>; // IP -> MAC
  macTable?: Record<string, string>; // MAC -> Port ID (for switches)
  routingTable?: RoutingEntry[];
  ports: DevicePort[];
}

export interface RoutingEntry {
  network: string;
  mask: string;
  gateway: string;
  interface: string;
}

export interface NetworkSegment {
  id: string;
  type: 'L2' | 'L3';
  name: string;
  network?: string; // For L3 segments
  mask?: string;
  devices: string[]; // Device IDs
  color: string;
}

export interface PacketAnimation {
  x: number;
  y: number;
  progress: number;
  pathSegmentIndex: number;
}

export interface Packet {
  id: string;
  sourceDeviceId: string;
  destinationDeviceId: string;
  sourceIP: string;
  destinationIP: string;
  sourceMac: string;
  destinationMac: string;
  type: 'ICMP' | 'ARP' | 'DATA';
  status: 'sending' | 'routing' | 'delivered' | 'failed';
  path: string[]; // Device IDs in the path
  currentPosition: number;
  animation?: PacketAnimation;
  createdAt: number;
  // For ICMP reply generation
  needsReply?: boolean;
  replySourceId?: string;
  replyDestinationId?: string;
  isReply?: boolean; // Mark if this is a reply packet
}

export interface Connection {
  id: string;
  fromDeviceId: string;
  fromPortId: string;
  toDeviceId: string;
  toPortId: string;
  type: 'ethernet' | 'serial';
  status: 'connected' | 'disconnected';
}

export interface PingResult {
  deviceId: string;
  targetIP: string;
  responseTime: number;
  success: boolean;
  timestamp: number;
}

export interface NetworkState {
  devices: NetworkDevice[];
  segments: NetworkSegment[];
  packets: Packet[];
  connections: Connection[];
  selectedDevice: string | null;
  selectedSegment: string | null;
  selectedConnection: string | null;
  connectionMode: boolean; // UI mode for creating connections
  simulationSpeed: number;
  pingResults: PingResult[];
}