import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-lobby',
  imports: [],
  template: `
    <div class="card">
      <h1>A-MATH</h1>
      <p class="user">สวัสดี {{ username }}</p>

      <button (click)="createRoom()">สร้างห้อง</button>
      <button (click)="goJoin()">เข้าห้อง</button>

      <button class="logout" (click)="logout()">ออกจากระบบ</button>
    </div>
  `,
  styles: [`
    .card { width: 320px; margin: 80px auto; padding: 24px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; }
    h1 { margin-bottom: 4px; letter-spacing: 2px; }
    .user { color: #666; }
    button { width: 100%; margin-top: 12px; padding: 10px; background: #1976d2; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 15px; }
    .logout { background: #d32f2f; }
  `],
})
export class LobbyComponent {
  username = '';

  constructor(
    private auth: AuthService,
    private game: GameService,
    private router: Router,
  ) {
    this.username = this.auth.getUsername();
  }

  createRoom(): void {
    this.game.createGame(this.username).subscribe({
      next: (state) => this.router.navigate(['/game', state.gameId]),
      error: (err) => alert(err.error?.message ?? 'สร้างห้องไม่สำเร็จ'),
    });
  }

  goJoin(): void {
    this.router.navigate(['/join']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}