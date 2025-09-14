import React, { useRef, useEffect, useState } from 'react';
import { NetworkDevice, NetworkSegment, Packet, Connection } from '../types/network';

interface NetworkCanvasProps {
  devices: NetworkDevice[];
  segments: NetworkSegment[];
  packets: Packet[];
  connections: Connection[];
  selectedDevice: string | null;
  selectedSegment: string | null;
  selectedConnection: string | null;
  connectionMode: boolean;
  onDeviceClick: (deviceId: string) => void;
  onSegmentClick: (segmentId: string) => void;
  onConnectionClick: (connectionId: string) => void;
  onCanvasClick: (position: { x: number; y: number }) => void;
  onDeviceMove?: (deviceId: string, newPosition: { x: number; y: number }) => void;
}

const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  devices,
  segments,
  packets,
  connections,
  selectedDevice,
  selectedSegment,
  selectedConnection,
  connectionMode,
  onDeviceClick,
  onSegmentClick,
  onConnectionClick,
  onCanvasClick,
  onDeviceMove
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize] = useState({ width: 1000, height: 600 });
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragFrom: { x: number; y: number; deviceId?: string } | null;
    dragTo: { x: number; y: number } | null;
    draggingDevice: string | null;
  }>({
    isDragging: false,
    dragFrom: null,
    dragTo: null,
    draggingDevice: null
  });
  const [pixelRatio] = useState(window.devicePixelRatio || 1);

  // Utility functions
  const getDeviceColor = (device: NetworkDevice): string => {
    switch (device.type) {
      case 'client': return '#4ECDC4';
      case 'router': return '#FF6B6B';
      case 'switch': return '#45B7D1';
      default: return '#cccccc';
    }
  };

  const getDeviceIcon = (type: string): string => {
    switch (type) {
      case 'client': return 'PC';
      case 'router': return 'R';
      case 'switch': return 'S';
      default: return '?';
    }
  };

  const getPacketColor = (type: string): string => {
    switch (type) {
      case 'ICMP': return '#FF9FF3';
      case 'ARP': return '#FCEA2B';
      case 'DATA': return '#96CEB4';
      default: return '#cccccc';
    }
  };

  // Drawing functions
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= canvasSize.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvasSize.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }
  };

  const drawSegment = (ctx: CanvasRenderingContext2D, segment: NetworkSegment) => {
    const segmentDevices = devices.filter(d => segment.devices.includes(d.id));
    if (segmentDevices.length === 0) return;

    // Calculate bounding box for segment devices
    const positions = segmentDevices.map(d => d.position);
    const minX = Math.min(...positions.map(p => p.x)) - 50;
    const minY = Math.min(...positions.map(p => p.y)) - 50;
    const maxX = Math.max(...positions.map(p => p.x)) + 50;
    const maxY = Math.max(...positions.map(p => p.y)) + 50;

    // Draw segment background
    ctx.fillStyle = segment.color + '20';
    ctx.strokeStyle = segment.color;
    ctx.lineWidth = selectedSegment === segment.id ? 3 : 1;
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

    // Draw segment label
    ctx.fillStyle = segment.color;
    ctx.font = '12px Arial';
    ctx.fillText(
      `${segment.type}: ${segment.name}${segment.network ? ` (${segment.network})` : ''}`,
      minX + 5,
      minY + 15
    );
  };

  const drawConnection = (ctx: CanvasRenderingContext2D, connection: Connection) => {
    const fromDevice = devices.find(d => d.id === connection.fromDeviceId);
    const toDevice = devices.find(d => d.id === connection.toDeviceId);
    
    if (!fromDevice || !toDevice) return;

    ctx.strokeStyle = selectedConnection === connection.id ? '#ff0000' : '#333333';
    ctx.lineWidth = selectedConnection === connection.id ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(fromDevice.position.x, fromDevice.position.y);
    ctx.lineTo(toDevice.position.x, toDevice.position.y);
    ctx.stroke();

    // Draw connection status indicator
    const midX = (fromDevice.position.x + toDevice.position.x) / 2;
    const midY = (fromDevice.position.y + toDevice.position.y) / 2;
    
    ctx.fillStyle = connection.status === 'connected' ? '#4CAF50' : '#F44336';
    ctx.beginPath();
    ctx.arc(midX, midY, 4, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawLogicalConnections = (ctx: CanvasRenderingContext2D) => {
    segments.forEach(segment => {
      if (segment.type === 'L2') {
        const segmentDevices = devices.filter(d => segment.devices.includes(d.id));
        
        // Draw connections between all devices in L2 segment
        for (let i = 0; i < segmentDevices.length - 1; i++) {
          for (let j = i + 1; j < segmentDevices.length; j++) {
            const device1 = segmentDevices[i];
            const device2 = segmentDevices[j];
            
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(device1.position.x, device1.position.y);
            ctx.lineTo(device2.position.x, device2.position.y);
            ctx.stroke();
          }
        }
      }
    });
  };

  const drawDevice = (ctx: CanvasRenderingContext2D, device: NetworkDevice, isDragging: boolean = false) => {
    const { x, y } = device.position;
    const radius = 20;
    
    // Set opacity for dragging effect
    const originalAlpha = ctx.globalAlpha;
    if (isDragging) {
      ctx.globalAlpha = 0.7;
    }
    
    // Device circle with dragging glow effect
    if (isDragging) {
      // Add glow effect for dragged device
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius + 10);
      glowGradient.addColorStop(0, getDeviceColor(device));
      glowGradient.addColorStop(1, getDeviceColor(device) + '00');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius + 10, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    ctx.fillStyle = getDeviceColor(device);
    ctx.strokeStyle = selectedDevice === device.id ? '#ff0000' : isDragging ? '#4CAF50' : '#333333';
    ctx.lineWidth = selectedDevice === device.id ? 3 : isDragging ? 3 : 2;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Device icon
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(getDeviceIcon(device.type), x, y + 4);

    // Device name
    ctx.fillStyle = '#333333';
    ctx.font = '10px Arial';
    ctx.fillText(device.name, x, y + radius + 15);

    // IP Address (if exists)
    if (device.ipAddress) {
      ctx.fillText(device.ipAddress, x, y + radius + 28);
    }
    
    // Restore original alpha
    ctx.globalAlpha = originalAlpha;
  };

  const drawPorts = (ctx: CanvasRenderingContext2D, device: NetworkDevice) => {
    const { x, y } = device.position;
    const portRadius = 6;
    const deviceRadius = 20;
    
    device.ports.forEach((port, index) => {
      const angle = (index * 2 * Math.PI) / device.ports.length;
      const portX = x + Math.cos(angle) * (deviceRadius + 15);
      const portY = y + Math.sin(angle) * (deviceRadius + 15);
      
      // Port circle
      ctx.fillStyle = port.connectedTo ? '#4CAF50' : '#FFC107';
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.arc(portX, portY, portRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // Port label
      ctx.fillStyle = '#333333';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(port.name, portX, portY + portRadius + 10);
      
      // Connection line to device
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(portX, portY);
      ctx.stroke();
    });
  };

  const drawEnhancedPacket = (ctx: CanvasRenderingContext2D, packet: Packet) => {
    if (packet.path.length < 2) return;

    const currentDeviceId = packet.path[packet.currentPosition];
    const nextDeviceId = packet.path[packet.currentPosition + 1];
    
    const currentDevice = devices.find(d => d.id === currentDeviceId);
    const nextDevice = devices.find(d => d.id === nextDeviceId);
    
    if (!currentDevice || !nextDevice) return;

    // Smooth animation progress
    const timeSinceCreated = Date.now() - packet.createdAt;
    const animationDuration = 2000; // 2 seconds per hop
    const progress = Math.min((timeSinceCreated % animationDuration) / animationDuration, 1);

    const x = currentDevice.position.x + (nextDevice.position.x - currentDevice.position.x) * progress;
    const y = currentDevice.position.y + (nextDevice.position.y - currentDevice.position.y) * progress;

    // Draw packet trail effect
    const trailLength = 5;
    for (let i = 0; i < trailLength; i++) {
      const trailProgress = Math.max(0, progress - (i * 0.1));
      const trailX = currentDevice.position.x + (nextDevice.position.x - currentDevice.position.x) * trailProgress;
      const trailY = currentDevice.position.y + (nextDevice.position.y - currentDevice.position.y) * trailProgress;
      const alpha = (1 - i / trailLength) * 0.3;
      
      ctx.fillStyle = getPacketColor(packet.type) + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(trailX, trailY, 6 - i, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw main packet with glow effect
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
    gradient.addColorStop(0, getPacketColor(packet.type));
    gradient.addColorStop(0.7, getPacketColor(packet.type) + '80');
    gradient.addColorStop(1, getPacketColor(packet.type) + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, 2 * Math.PI);
    ctx.fill();

    // Main packet body
    ctx.fillStyle = getPacketColor(packet.type);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Packet type label with better visibility
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(packet.type, x, y);

    // Show packet info on hover (simplified)
    ctx.fillStyle = '#333333';
    ctx.font = '8px Arial';
    ctx.fillText(`${packet.sourceIP} → ${packet.destinationIP}`, x, y + 25);
  };

  const drawDragConnection = (ctx: CanvasRenderingContext2D) => {
    if (!dragState.dragFrom || !dragState.dragTo) return;

    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(dragState.dragFrom.x, dragState.dragFrom.y);
    ctx.lineTo(dragState.dragTo.x, dragState.dragTo.y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI canvas setup
    const displayWidth = canvasSize.width;
    const displayHeight = canvasSize.height;
    
    canvas.width = displayWidth * pixelRatio;
    canvas.height = displayHeight * pixelRatio;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw grid
    drawGrid(ctx);

    // Draw segments
    segments.forEach(segment => drawSegment(ctx, segment));

    // Draw physical connections
    connections.forEach(connection => drawConnection(ctx, connection));

    // Draw connections between devices in same L2 segment (logical)
    drawLogicalConnections(ctx);

    // Draw devices
    devices.forEach(device => drawDevice(ctx, device, device.id === dragState.draggingDevice));

    // Draw ports for selected device or in connection mode
    if (selectedDevice || connectionMode) {
      const deviceToDraw = selectedDevice ? devices.find(d => d.id === selectedDevice) : null;
      if (deviceToDraw) drawPorts(ctx, deviceToDraw);
    }

    // Draw drag connection if dragging
    if (dragState.isDragging && dragState.dragFrom && dragState.dragTo) {
      drawDragConnection(ctx);
    }

    // Draw packets with improved animations
    packets.forEach(packet => drawEnhancedPacket(ctx, packet));

  }, [devices, segments, packets, connections, selectedDevice, selectedSegment, selectedConnection, connectionMode, canvasSize, dragState, pixelRatio, drawGrid, drawSegment, drawLogicalConnections, drawConnection, drawDevice, drawDragConnection, drawEnhancedPacket]);

  // Utility functions
  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  // Mouse event handlers
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(event);

    // Check if click is on a device
    const clickedDevice = devices.find(device => {
      const dx = x - device.position.x;
      const dy = y - device.position.y;
      return Math.sqrt(dx * dx + dy * dy) <= 20;
    });

    if (clickedDevice) {
      if (connectionMode) {
        // Drag connection mode
        setDragState({
          isDragging: true,
          dragFrom: { x: clickedDevice.position.x, y: clickedDevice.position.y, deviceId: clickedDevice.id },
          dragTo: { x, y },
          draggingDevice: null
        });
      } else {
        // Device dragging mode
        setDragState({
          isDragging: true,
          dragFrom: { x: clickedDevice.position.x, y: clickedDevice.position.y, deviceId: clickedDevice.id },
          dragTo: { x, y },
          draggingDevice: clickedDevice.id
        });
      }
      event.preventDefault();
      return;
    }

    handleCanvasClick(event);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragState.isDragging) {
      const { x, y } = getCanvasCoordinates(event);
      
      if (dragState.draggingDevice && onDeviceMove) {
        // Update device position in real-time while dragging
        onDeviceMove(dragState.draggingDevice, { x, y });
      }
      
      setDragState(prev => ({
        ...prev,
        dragTo: { x, y }
      }));
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragState.isDragging && dragState.dragFrom) {
      const { x, y } = getCanvasCoordinates(event);
      
      if (connectionMode && dragState.dragFrom.deviceId) {
        // Connection mode - check if dropped on a device
        const targetDevice = devices.find(device => {
          const dx = x - device.position.x;
          const dy = y - device.position.y;
          return Math.sqrt(dx * dx + dy * dy) <= 20;
        });

        if (targetDevice && targetDevice.id !== dragState.dragFrom.deviceId) {
          // Create connection between devices
          onDeviceClick(dragState.dragFrom.deviceId);
          setTimeout(() => onDeviceClick(targetDevice.id), 100);
        }
      } else if (dragState.draggingDevice && onDeviceMove) {
        // Device dragging mode - final position update
        onDeviceMove(dragState.draggingDevice, { x, y });
      }

      setDragState({
        isDragging: false,
        dragFrom: null,
        dragTo: null,
        draggingDevice: null
      });
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragState.isDragging) return;

    const { x, y } = getCanvasCoordinates(event);

    // Check if click is on a device
    const clickedDevice = devices.find(device => {
      const dx = x - device.position.x;
      const dy = y - device.position.y;
      return Math.sqrt(dx * dx + dy * dy) <= 20;
    });

    if (clickedDevice) {
      onDeviceClick(clickedDevice.id);
      return;
    }

    // Check if click is on a connection
    const clickedConnection = connections.find(connection => {
      const fromDevice = devices.find(d => d.id === connection.fromDeviceId);
      const toDevice = devices.find(d => d.id === connection.toDeviceId);
      
      if (!fromDevice || !toDevice) return false;
      
      // Check if click is near the connection line
      const lineLength = Math.sqrt(
        Math.pow(toDevice.position.x - fromDevice.position.x, 2) +
        Math.pow(toDevice.position.y - fromDevice.position.y, 2)
      );
      
      if (lineLength === 0) return false;
      
      const distanceToLine = Math.abs(
        (toDevice.position.y - fromDevice.position.y) * x -
        (toDevice.position.x - fromDevice.position.x) * y +
        toDevice.position.x * fromDevice.position.y -
        toDevice.position.y * fromDevice.position.x
      ) / lineLength;
      
      return distanceToLine <= 10 && 
             x >= Math.min(fromDevice.position.x, toDevice.position.x) - 10 &&
             x <= Math.max(fromDevice.position.x, toDevice.position.x) + 10 &&
             y >= Math.min(fromDevice.position.y, toDevice.position.y) - 10 &&
             y <= Math.max(fromDevice.position.y, toDevice.position.y) + 10;
    });

    if (clickedConnection) {
      onConnectionClick(clickedConnection.id);
      return;
    }

    // Check if click is on a segment
    const clickedSegment = segments.find(segment => {
      const segmentDevices = devices.filter(d => segment.devices.includes(d.id));
      if (segmentDevices.length === 0) return false;

      const positions = segmentDevices.map(d => d.position);
      const minX = Math.min(...positions.map(p => p.x)) - 50;
      const minY = Math.min(...positions.map(p => p.y)) - 50;
      const maxX = Math.max(...positions.map(p => p.x)) + 50;
      const maxY = Math.max(...positions.map(p => p.y)) + 50;

      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    });

    if (clickedSegment) {
      onSegmentClick(clickedSegment.id);
      return;
    }

    // Click on empty canvas
    onCanvasClick({ x, y });
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        border: '1px solid #ccc',
        cursor: dragState.isDragging 
          ? 'grabbing' 
          : connectionMode 
          ? 'crosshair' 
          : 'pointer',
        background: '#fafafa'
      }}
    />
  );
};

export default NetworkCanvas;