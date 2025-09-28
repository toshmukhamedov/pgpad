import { emit, listen, type UnlistenFn, once } from '@tauri-apps/api/event';
import type { LSPClient, Transport } from '@codemirror/lsp-client';

/// Front-end sends messages to the backend using `lsp-request` event.
/// Backend sends responses to the front-end using `lsp-response` events.
export class TauriLSPTransport implements Transport {
	private handlers: ((message: string) => void)[] = [];
	private unlisten: UnlistenFn | null = null;
	private unlistenInitialized: UnlistenFn | null = null;
	private client: LSPClient;

	constructor(client: LSPClient) {
		this.client = client;
		console.log('TauriLSPTransport initialized with event-based communication');
		this.initializeEventListener();
	}

	private async initializeEventListener(): Promise<void> {
		try {
			this.unlisten = await listen('lsp-response', (event) => {
				const message = event.payload as string;
				console.log('LSP Transport received message:', message);

				// Forward event to CodeMirror handlers
				this.handlers.forEach((handler) => handler(message));
			});

			this.unlistenInitialized = await once('lsp-initialized', () => {
				console.log('LSP Transport received lsp-initialized event');
				this.client.connect(this);
			});

			console.log('LSP event listener initialized');
		} catch (error) {
			console.error('Failed to initialize LSP event listener:', error);
		}
	}

	send(message: string): void {
		console.log('LSP Transport sending message:', message);

		emit('lsp-request', message).catch((error) => {
			console.error('Failed to emit LSP request:', error);
		});
	}

	subscribe(handler: (message: string) => void): void {
		this.handlers.push(handler);
	}

	unsubscribe(handler: (message: string) => void): void {
		this.handlers = this.handlers.filter((h) => h !== handler);
	}

	dispose(): void {
		if (this.unlisten) {
			this.unlisten();
			this.unlisten = null;
		}
		if (this.unlistenInitialized) {
			this.unlistenInitialized();
			this.unlistenInitialized = null;
		}
	}

	async updateSelectedConnection(connectionId: string): Promise<void> {
		const message = JSON.stringify({
			jsonrpc: '2.0',
			id: Date.now(),
			method: 'pgpad/connectionSelected',
			params: connectionId
		});

		await emit('lsp-request', message);
	}
}
