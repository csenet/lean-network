import React, { useState, useRef, useEffect } from 'react';
import { NetworkDevice } from '../types/network';

interface TerminalProps {
  selectedDevice: NetworkDevice | null;
  devices: NetworkDevice[];
  onExecuteCommand: (deviceId: string, command: string) => void;
  isVisible: boolean;
  onToggle: () => void;
}

interface TerminalLine {
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

const Terminal: React.FC<TerminalProps> = ({
  selectedDevice,
  devices,
  onExecuteCommand,
  isVisible,
  onToggle
}) => {
  const [history, setHistory] = useState<TerminalLine[]>([
    {
      type: 'output',
      content: 'Packet Explorer Terminal v1.0',
      timestamp: new Date()
    },
    {
      type: 'output',
      content: 'Type "help" for available commands.',
      timestamp: new Date()
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const addToHistory = (type: 'input' | 'output' | 'error', content: string) => {
    setHistory(prev => [...prev, {
      type,
      content,
      timestamp: new Date()
    }]);
  };

  const executeCommand = (command: string) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add input to history
    addToHistory('input', `${getPrompt()} ${trimmedCommand}`);

    // Parse command
    const args = trimmedCommand.split(' ');
    const cmd = args[0].toLowerCase();

    switch (cmd) {
      case 'help':
        showHelp();
        break;
      case 'ping':
        executePing(args);
        break;
      case 'arp':
        executeArp(args);
        break;
      case 'route':
        executeRoute(args);
        break;
      case 'ifconfig':
      case 'ipconfig':
        executeIfconfig();
        break;
      case 'clear':
        setHistory([]);
        break;
      case 'devices':
        listDevices();
        break;
      case 'switch':
        switchDevice(args);
        break;
      default:
        addToHistory('error', `Command not found: ${cmd}`);
        addToHistory('output', 'Type "help" for available commands.');
        break;
    }

    setCurrentInput('');
  };

  const getPrompt = () => {
    return selectedDevice ? `${selectedDevice.name}@packet-explorer:~$` : 'packet-explorer:~$';
  };

  const showHelp = () => {
    const helpText = [
      'Available commands:',
      '  ping <ip>          - Send ICMP ping to target IP',
      '  arp [-a]           - Show/manage ARP table',
      '  route [-n]         - Show routing table',
      '  ifconfig/ipconfig  - Show interface configuration',
      '  devices            - List all devices',
      '  switch <device>    - Switch to another device',
      '  clear              - Clear terminal',
      '  help               - Show this help message',
      '',
      'Examples:',
      '  ping 192.168.1.2',
      '  arp -a',
      '  switch Router1'
    ];
    helpText.forEach(line => addToHistory('output', line));
  };

  const executePing = (args: string[]) => {
    if (!selectedDevice) {
      addToHistory('error', 'No device selected. Use "switch <device>" to select a device.');
      return;
    }

    if (args.length < 2) {
      addToHistory('error', 'Usage: ping <ip-address>');
      return;
    }

    const targetIp = args[1];
    const targetDevice = devices.find(d => d.ipAddress === targetIp);

    if (!targetDevice) {
      addToHistory('output', `PING ${targetIp}: Host unreachable`);
      return;
    }

    addToHistory('output', `PING ${targetIp} (${targetDevice.name}): 56 data bytes`);
    addToHistory('output', `64 bytes from ${targetIp}: icmp_seq=1 ttl=64 time=1.234ms`);
    addToHistory('output', `64 bytes from ${targetIp}: icmp_seq=2 ttl=64 time=0.987ms`);
    addToHistory('output', `64 bytes from ${targetIp}: icmp_seq=3 ttl=64 time=1.123ms`);
    addToHistory('output', `--- ${targetIp} ping statistics ---`);
    addToHistory('output', '3 packets transmitted, 3 received, 0% packet loss');

    // Trigger actual packet sending
    onExecuteCommand(selectedDevice.id, `ping ${targetIp}`);
  };

  const executeArp = (args: string[]) => {
    if (!selectedDevice) {
      addToHistory('error', 'No device selected.');
      return;
    }

    if (args.length > 1 && args[1] === '-a') {
      addToHistory('output', 'ARP Table:');
      addToHistory('output', 'Internet Address      Physical Address      Type');
      
      if (Object.keys(selectedDevice.arpTable).length === 0) {
        addToHistory('output', 'No entries found.');
      } else {
        Object.entries(selectedDevice.arpTable).forEach(([ip, mac]) => {
          addToHistory('output', `${ip.padEnd(20)} ${mac.padEnd(20)} dynamic`);
        });
      }
    } else {
      addToHistory('output', 'Usage: arp -a (show all entries)');
    }
  };

  const executeRoute = (args: string[]) => {
    if (!selectedDevice) {
      addToHistory('error', 'No device selected.');
      return;
    }

    if (selectedDevice.type !== 'router' || !selectedDevice.routingTable) {
      addToHistory('output', 'Routing table not available for this device type.');
      return;
    }

    addToHistory('output', 'Kernel IP routing table');
    addToHistory('output', 'Destination     Gateway         Genmask         Interface');
    
    if (selectedDevice.routingTable.length === 0) {
      addToHistory('output', 'No routes configured.');
    } else {
      selectedDevice.routingTable.forEach(route => {
        addToHistory('output', 
          `${route.network.padEnd(15)} ${route.gateway.padEnd(15)} ${route.mask.padEnd(15)} ${route.interface}`
        );
      });
    }
  };

  const executeIfconfig = () => {
    if (!selectedDevice) {
      addToHistory('error', 'No device selected.');
      return;
    }

    addToHistory('output', `Device: ${selectedDevice.name}`);
    addToHistory('output', `Type: ${selectedDevice.type}`);
    addToHistory('output', `MAC Address: ${selectedDevice.macAddress}`);
    
    if (selectedDevice.ipAddress) {
      addToHistory('output', `IP Address: ${selectedDevice.ipAddress}`);
      addToHistory('output', `Subnet Mask: ${selectedDevice.subnetMask || 'Not set'}`);
      addToHistory('output', `Default Gateway: ${selectedDevice.defaultGateway || 'Not set'}`);
    } else {
      addToHistory('output', 'IP Address: Not configured');
    }

    addToHistory('output', `Ports: ${selectedDevice.ports.length}`);
    selectedDevice.ports.forEach(port => {
      addToHistory('output', `  ${port.name}: ${port.status} ${port.connectedTo ? '(connected)' : '(disconnected)'}`);
    });
  };

  const listDevices = () => {
    addToHistory('output', 'Available devices:');
    devices.forEach(device => {
      const status = selectedDevice?.id === device.id ? ' (selected)' : '';
      addToHistory('output', `  ${device.name} (${device.type}) - ${device.ipAddress || 'No IP'}${status}`);
    });
  };

  const switchDevice = (args: string[]) => {
    if (args.length < 2) {
      addToHistory('error', 'Usage: switch <device-name>');
      return;
    }

    const deviceName = args.slice(1).join(' ');
    const targetDevice = devices.find(d => d.name.toLowerCase() === deviceName.toLowerCase());

    if (!targetDevice) {
      addToHistory('error', `Device "${deviceName}" not found.`);
      addToHistory('output', 'Use "devices" to see available devices.');
      return;
    }

    addToHistory('output', `Switched to device: ${targetDevice.name}`);
    // This would need to be implemented in the parent component
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
    }
  };

  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!isVisible) {
    return (
      <div className="terminal-toggle">
        <button onClick={onToggle} className="terminal-toggle-button">
          🖥️ Terminal
        </button>
      </div>
    );
  }

  return (
    <div className="terminal-container" onClick={handleTerminalClick}>
      <div className="terminal-header">
        <div className="terminal-title">
          <span>🖥️ Packet Explorer Terminal</span>
          {selectedDevice && (
            <span className="terminal-device">({selectedDevice.name})</span>
          )}
        </div>
        <button onClick={onToggle} className="terminal-close">✕</button>
      </div>
      
      <div className="terminal-body" ref={terminalRef}>
        {history.map((line, index) => (
          <div key={index} className={`terminal-line terminal-${line.type}`}>
            <span className="terminal-content">{line.content}</span>
          </div>
        ))}
        
        <div className="terminal-input-line">
          <span className="terminal-prompt">{getPrompt()}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-input"
            spellCheck={false}
            autoComplete="off"
            tabIndex={0}
            placeholder="コマンドを入力してください..."
          />
        </div>
      </div>
    </div>
  );
};

export default Terminal;