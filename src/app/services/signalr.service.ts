import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private connection: HubConnection | null = null;
  private pendingListeners: Array<[string, (...args: any[]) => void]> = [];

  connect(): Promise<void> {
    if (this.connection && this.connection.state === HubConnectionState.Connected) {
      return Promise.resolve();
    }

    if (this.connection && this.connection.state === HubConnectionState.Connecting) {
      return this.connection.start();
    }

    const base = environment.apiUrl.replace(/\/api$/, '');
    this.connection = new HubConnectionBuilder()
      .withUrl(`${base}/hub/game`)
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    for (const [event, callback] of this.pendingListeners) {
      this.connection.on(event, callback);
    }

    return this.connection.start();
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (this.connection) {
      this.connection.on(event, callback);
    } else {
      this.pendingListeners.push([event, callback]);
    }
  }

  joinGame(gameId: string): void {
    this.connection?.invoke('JoinGame', gameId).catch(() => {});
  }

  leaveGame(gameId: string): void {
    this.connection?.invoke('LeaveGame', gameId).catch(() => {});
  }
}