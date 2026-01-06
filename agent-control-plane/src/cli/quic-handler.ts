/**
 * QUIC transport proxy handler
 */

import { spawn } from 'child_process';
import { dirname, resolve } from 'path';

export class QuicHandler {
  async run(args: string[], currentFilePath: string): Promise<void> {
    let port = parseInt(process.env.QUIC_PORT || '4433');
    let certPath = process.env.QUIC_CERT_PATH;
    let keyPath = process.env.QUIC_KEY_PATH;

    for (let i = 0; i < args.length; i++) {
      if ((args[i] === '--port' || args[i] === '-P') && args[i + 1]) {
        port = parseInt(args[++i]);
      } else if ((args[i] === '--cert' || args[i] === '-c') && args[i + 1]) {
        certPath = args[++i];
      } else if ((args[i] === '--key' || args[i] === '-k') && args[i + 1]) {
        keyPath = args[++i];
      }
    }

    console.log(`
╔═══════════════════════════════════════════════════════╗
║      Agentic Flow - QUIC Transport Proxy Server       ║
║           Ultra-Low Latency Agent Communication       ║
╚═══════════════════════════════════════════════════════╝
`);

    console.log(`🚀 Starting QUIC Transport Server
📍 Port: ${port}
🔐 Protocol: QUIC (UDP-based, TLS 1.3 encrypted)
⚡ Performance: 50-70% faster than TCP
`);

    if (certPath && keyPath) {
      console.log(`🔒 TLS Certificates:
   Cert: ${certPath}
   Key:  ${keyPath}
`);
    } else {
      console.log(`⚠️  Warning: No TLS certificates specified, using development certificates
   Set QUIC_CERT_PATH and QUIC_KEY_PATH for production use
`);
    }

    const __dirname = dirname(currentFilePath);
    const quicProxyPath = resolve(__dirname, '../proxy/quic-proxy.js');

    const env = { ...process.env };
    if (certPath) env.QUIC_CERT_PATH = certPath;
    if (keyPath) env.QUIC_KEY_PATH = keyPath;
    env.QUIC_PORT = port.toString();

    const proc = spawn('node', [quicProxyPath], {
      stdio: 'inherit',
      env: env as NodeJS.ProcessEnv,
    });

    console.log(`✅ QUIC server running on UDP port ${port}!

Features:
  • 0-RTT connection establishment
  • 100+ concurrent streams per connection
  • Built-in TLS 1.3 encryption
  • Connection migration support
  • Automatic packet loss recovery

Use with agents:
  import { QuicTransport } from 'agent-control-plane/transport/quic';
  const transport = new QuicTransport({ port: ${port} });
  await transport.connect();

Press Ctrl+C to stop...
`);

    proc.on('exit', (code) => {
      console.log(`\n👋 QUIC server stopped (exit code: ${code})`);
      process.exit(code || 0);
    });

    process.on('SIGINT', () => {
      console.log('\n\n👋 Shutting down QUIC server...');
      proc.kill('SIGINT');
    });

    process.on('SIGTERM', () => proc.kill('SIGTERM'));
  }
}
