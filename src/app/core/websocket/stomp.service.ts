import { Injectable, signal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, filter, Observable, switchMap } from 'rxjs';

const WS_URL = 'ws://localhost:8080/api/ws';
const RECONNECT_DELAY_MS = 5000;

@Injectable({ providedIn: 'root' })
export class StompService {
  private client: Client | null = null;
  private readonly connection$ = new BehaviorSubject<boolean>(false);

  readonly connected = signal(false);

  connect(token: string): void {
    if (this.client) {
      if (this.client.active) return;
      this.client.activate();
      return;
    }

    this.client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: RECONNECT_DELAY_MS,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      debug: () => undefined,
      onConnect: () => {
        this.connected.set(true);
        this.connection$.next(true);
      },
      onDisconnect: () => {
        this.connected.set(false);
        this.connection$.next(false);
      },
      onWebSocketClose: () => {
        this.connected.set(false);
        this.connection$.next(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message'], frame.body);
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    if (!this.client) return;
    this.client.deactivate();
    this.client = null;
    this.connected.set(false);
    this.connection$.next(false);
  }

  watch<T>(destination: string): Observable<T> {
    return this.connection$.pipe(
      filter((isConnected) => isConnected),
      switchMap(
        () =>
          new Observable<T>((subscriber) => {
            const client = this.client;
            if (!client?.connected) return;

            const sub = client.subscribe(destination, (msg: IMessage) => {
              try {
                subscriber.next(JSON.parse(msg.body) as T);
              } catch (err) {
                console.error('Failed to parse STOMP message', destination, err);
              }
            });

            return () => {
              try {
                sub.unsubscribe();
              } catch {
                // swallow — client may already be disconnecting
              }
            };
          })
      )
    );
  }
}
