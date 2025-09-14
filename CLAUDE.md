# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm start` - Start development server on localhost:3000
- `pnpm run build` - Create production build
- `pnpm test` - Run Jest tests
- `pnpm run deploy` - Build and deploy to Cloudflare Workers using wrangler

### Testing
- `pnpm test` - Run all tests with Jest and React Testing Library
- `pnpm test -- --watchAll=false` - Run tests once without watch mode

## Architecture Overview

This is a React-based network simulation application for educational purposes. The app visualizes OSI Layer 2/3 network communication through interactive packet animations.

### Core Architecture Pattern

The application follows a centralized state management pattern using a custom hook (`useNetworkSimulation`) that manages all network state and operations. This hook acts as the single source of truth for:

- Network devices (clients, routers, switches)
- Network segments (L2/L3)
- Packet animations and routing
- Device connections
- UI state (selection, connection mode)

### Key Components Structure

```
src/
├── hooks/useNetworkSimulation.ts    # Central state management hook
├── types/network.ts                 # Core TypeScript interfaces
├── utils/networkUtils.ts            # Network utility functions
└── components/
    ├── NetworkCanvas.tsx           # Main visualization canvas
    ├── ControlPanel.tsx            # Device creation and controls
    ├── DeviceModal.tsx             # Device configuration modal
    ├── Terminal.tsx                # Command-line interface
    └── DocumentationPanel.tsx      # Help documentation
```

### Core Data Models

- **NetworkDevice**: Represents clients, routers, and switches with ports, routing tables, and ARP tables
- **NetworkSegment**: L2/L3 network segments that group devices
- **Packet**: Represents network packets with animation state and routing information
- **Connection**: Physical connections between device ports

### State Management Pattern

All network operations flow through the `useNetworkSimulation` hook which:
1. Maintains immutable state updates
2. Handles packet routing and animation logic
3. Manages device interactions and connections
4. Provides callback functions to components

### Animation System

The packet animation system uses:
- Real-time path calculation between devices
- Smooth interpolation for packet movement
- Device-specific processing delays
- Visual feedback for routing decisions

### Network Simulation Logic

- **ARP Resolution**: Automatic ARP table updates during packet routing
- **Routing Tables**: Support for static routing in router devices
- **Packet Types**: ICMP, ARP, and DATA packets with different behaviors
- **Connection Management**: Port-to-port connections between devices

## Development Notes

- The app supports Japanese UI text for educational use
- Uses React 19 with TypeScript for type safety
- Canvas-based rendering for network topology visualization
- Drag-and-drop functionality for device positioning
- Real-time packet animation with configurable simulation speed
- Preset network configurations for common learning scenarios

## File Organization Principles

- Network logic is centralized in the `useNetworkSimulation` hook
- Pure utility functions are separated in `utils/networkUtils.ts`
- TypeScript interfaces define the complete data model in `types/network.ts`
- Components are focused on presentation and user interaction only
- State mutations only occur through the central hook's callback functions