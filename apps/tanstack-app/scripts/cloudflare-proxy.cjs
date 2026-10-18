// Local development workaround for Wrangler 4.85's preview network transports.
// Use Miniflare's outboundService and Node's existing proxy support. No secrets
// are logged, and no installed dependency or deployed Worker is modified.
const https = require('node:https');
const Module = require('node:module');
const load = Module._load;
const replacements = new WeakMap();
let fetchWebSocket;
const needsLocalProxy = (name) => name === 'ProxyWorker' || name === 'zombie-couple-video';
const forwardThroughNode = async (request) => {
  try {
    // R2's remote binding tunnel upgrades to WebSocket. Native Node fetch
    // rejects Upgrade headers; Miniflare preserves status 101 and both peers.
    if (request.method === 'GET' && request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
      return await fetchWebSocket(request.url, {
        method: request.method, headers: Object.fromEntries(request.headers), redirect: 'manual',
      });
    }
    // Miniflare's internal RPC uses streamed POST bodies. Node's proxy transport
    // may replay a request; provide a repeatable byte source in local preview.
    const headers = new Headers(request.headers);
    const body = request.body ? Buffer.from(await request.arrayBuffer()) : undefined;
    if (body) {
      headers.delete('content-length');
      headers.delete('transfer-encoding');
    }
    return await fetch(request.url, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    });
  } catch (error) {
    // Keep signed URLs, headers and tokens out of development diagnostics.
    const causeCode = error.cause?.code || error.cause?.name || error.name;
    process.stderr.write(`Preview outbound request failed: ${request.method} ${new URL(request.url).origin} (${causeCode}).\n`);
    throw error;
  }
};
const withProxyOutbound = (options) => {
  if (needsLocalProxy(options?.name)) return { ...options, outboundService: forwardThroughNode };
  if (options?.workers) return { ...options, workers: options.workers.map((worker) =>
    needsLocalProxy(worker.name) ? { ...worker, outboundService: forwardThroughNode } : worker,
  ) };
  return options;
};
Module._load = function (...args) {
  const exports = Reflect.apply(load, this, args);
  if (args[0] !== 'miniflare' || !exports.Miniflare) return exports;
  fetchWebSocket = exports.fetch;
  if (!replacements.has(exports)) {
    class ProxyAwareMiniflare extends exports.Miniflare {
      constructor(options) {
        super(withProxyOutbound(options));
        this.r2TaskProxyWorker = needsLocalProxy(options?.name);
      }
      setOptions(options) {
        return super.setOptions(this.r2TaskProxyWorker
          ? { ...options, outboundService: forwardThroughNode }
          : withProxyOutbound(options));
      }
    }
    replacements.set(exports, new Proxy(exports, {
      get(target, key, receiver) {
        return key === 'Miniflare' ? ProxyAwareMiniflare : Reflect.get(target, key, receiver);
      },
    }));
  }
  return replacements.get(exports);
};
const request = https.request;
https.request = function (...args) {
  const options = args[0];
  if (options && typeof options === 'object' && !(options instanceof URL) && typeof options.createConnection === 'function' && options.agent == null) {
    const host = String(options.hostname || options.host || '');
    if (host.endsWith('.workers.dev') || host.endsWith('.cloudflareworkers.com') || host.endsWith('.cloudflare.com')) {
      args[0] = { ...options, agent: https.globalAgent };
      process.stderr.write('Routing Cloudflare preview WebSocket through the existing local proxy.\n');
    }
  }
  return Reflect.apply(request, this, args);
};
