export const generateMacAddress = (): string => {
  const hexDigits = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    if (i > 0) mac += ':';
    mac += hexDigits.charAt(Math.floor(Math.random() * 16));
    mac += hexDigits.charAt(Math.floor(Math.random() * 16));
  }
  return mac;
};

export const generateDeviceId = (): string => {
  return 'device_' + Math.random().toString(36).substr(2, 9);
};

export const generateSegmentId = (): string => {
  return 'segment_' + Math.random().toString(36).substr(2, 9);
};

export const generatePacketId = (): string => {
  return 'packet_' + Math.random().toString(36).substr(2, 9);
};

export const generateConnectionId = (): string => {
  return 'connection_' + Math.random().toString(36).substr(2, 9);
};

export const generatePortId = (): string => {
  return 'port_' + Math.random().toString(36).substr(2, 9);
};

export const ipToNumber = (ip: string): number => {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
};

export const numberToIp = (num: number): string => {
  return [(num >>> 24), (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
};

export const isInSameSubnet = (ip1: string, ip2: string, mask: string): boolean => {
  const ip1Num = ipToNumber(ip1);
  const ip2Num = ipToNumber(ip2);
  const maskNum = ipToNumber(mask);
  
  return (ip1Num & maskNum) === (ip2Num & maskNum);
};

export const getNetworkAddress = (ip: string, mask: string): string => {
  const ipNum = ipToNumber(ip);
  const maskNum = ipToNumber(mask);
  return numberToIp(ipNum & maskNum);
};

export const getBroadcastAddress = (ip: string, mask: string): string => {
  const ipNum = ipToNumber(ip);
  const maskNum = ipToNumber(mask);
  return numberToIp(ipNum | (~maskNum >>> 0));
};

export const validateIpAddress = (ip: string): boolean => {
  const parts = ip.split('.');
  return parts.length === 4 && parts.every(part => {
    const num = parseInt(part);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
};

export const getSubnetColors = (): string[] => {
  return [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FCEA2B', '#FF9FF3', '#54A0FF', '#5F27CD',
    '#00D2D3', '#FF9F43', '#EE5A24', '#0ABDE3'
  ];
};

export const createDefaultPorts = (deviceType: 'client' | 'router' | 'switch') => {
  const ports = [];
  let portCount = 1;
  
  switch (deviceType) {
    case 'client':
      portCount = 1;
      break;
    case 'switch':
      portCount = 4;
      break;
    case 'router':
      portCount = 2;
      break;
  }
  
  for (let i = 0; i < portCount; i++) {
    ports.push({
      id: generatePortId(),
      name: `Port ${i + 1}`,
      status: 'up' as const
    });
  }
  
  return ports;
};