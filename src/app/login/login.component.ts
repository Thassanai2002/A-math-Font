import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card">
      <h1>A-MATH</h1>
      <h2>เข้าสู่ระบบ</h2>
      <form (ngSubmit)="onSubmit()">
        <label>ชื่อผู้ใช้</label>
        <input type="text" [(ngModel)]="username" name="username" required />

        <label>รหัสผ่าน</label>
        <input type="password" [(ngModel)]="password" name="password" required />

        <p class="error">@if (error) { {{ error }} }</p>

        <button type="submit">เข้าสู่ระบบ</button>
      </form>
      <p class="center">ยังไม่มีบัญชี? <a routerLink="/register">สมัครสมาชิก</a></p>
    </div>
  `,
  styles: [`
    .card { width: 320px; margin: 100px auto; padding: 24px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { text-align: center; letter-spacing: 3px; margin-bottom: 4px; }
    h2 { text-align: center; margin-top: 0; }
    label { display: block; margin: 12px 0 4px; }
    input { width: 100%; padding: 8px; box-sizing: border-box; }
    button { width: 100%; margin-top: 16px; padding: 10px; background: #1976d2; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
    .error { color: #d32f2f; }
    .center { text-align: center; }
  `],
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    this.error = '';
    this.auth.login(this.username, this.password).subscribe({
      next: (res) => {
        this.auth.setUser(res.username);
        this.router.navigate(['/lobby']);
      },
      error: (err) => {
        this.error = err.error?.message ?? 'เข้าสู่ระบบไม่สำเร็จ';
      },
    });
  }
}