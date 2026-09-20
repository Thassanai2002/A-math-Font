import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GamePlayerDto {
  username: string;
  playerNumber: number;
  score: number;
}

export interface GameState {
  gameId: string;
  roomCode: string;
  status: string;
  players: GamePlayerDto[];
  currentTurn: number;
  timerSeconds: number;
  board: (string | null)[][];
  premium: (string | null)[][];
  yourRack: string[];
  bagCount: number;
  opponentTileCount: number;
  consecutivePasses: number;
  yourPlayerNumber: number;
  isYourTurn: boolean;
}

export interface Placement {
  row: number;
  col: number;
  tile: string;
  source: string;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  private apiUrl = `${environment.apiUrl}/games`;

  constructor(private http: HttpClient) {}

  createGame(username: string): Observable<GameState> {
    return this.http.post<GameState>(this.apiUrl, { username });
  }

  joinGame(username: string, roomCode: string): Observable<GameState> {
    return this.http.post<GameState>(`${this.apiUrl}/join`, { username, roomCode });
  }

  getGame(gameId: string, username: string): Observable<GameState> {
    return this.http.get<GameState>(`${this.apiUrl}/${gameId}`, {
      params: { username },
    });
  }

  place(gameId: string, username: string, placements: Placement[]): Observable<any> {
    const payload = {
      username,
      placements: placements.map((p) => ({
        row: p.row,
        col: p.col,
        tile: p.tile,
        source: p.source,
      })),
    };
    return this.http.post<any>(`${this.apiUrl}/${gameId}/place`, payload);
  }

  pass(gameId: string, username: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${gameId}/pass`, { username });
  }

  exchange(gameId: string, username: string, tiles: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${gameId}/exchange`, { username, tiles });
  }
}