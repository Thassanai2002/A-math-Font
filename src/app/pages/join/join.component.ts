import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-join',
  imports: [FormsModule],
  template: `
    <div class="card">
      <h1>A-MATH</h1>
      <h2>เข้าห้อง</h2>

      <label>Enter Room Code</label>
      <input type="text" [(ngModel)]="roomCode" name="roomCode" placeholder="A7K29B" maxlength="10" (keyup.enter)="join()" />

      <p class="error">@if (error) { {{ error }} }</p>

      <button (click)="join()">เข้าห้อง</button>
    </div>
  `,
  styles: [`
    .card { width: 320px; margin: 80px auto; padding: 24px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { text-align: center; margin-bottom: 4px; letter-spacing: 2px; }
    h2 { text-align: center; margin-top: 0; }
    label { display: block; margin: 12px 0 4px; }
    input { width: 100%; padding: 8px; box-sizing: border-box; text-transform: uppercase; }
    button { width: 100%; margin-top: 16px; padding: 10px; background: #1976d2; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
    .error { color: #d32f2f; }
  `],
})
export class JoinComponent {
  username = '';
  roomCode = '';
  error = '';

  constructor(
    private auth: AuthService,
    private game: GameService,
    private router: Router,
  ) {
    this.username = this.auth.getUsername();
  }

  join(): void {
    this.error = '';
    this.game.joinGame(this.username, this.roomCode).subscribe({
      next: (state) => this.router.navigate(['/game', state.gameId]),
      error: (err) => (this.error = err.error?.message ?? 'เข้าห้องไม่สำเร็จ'),
    });
  }
}