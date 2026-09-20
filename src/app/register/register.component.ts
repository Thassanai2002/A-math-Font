import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card">
      <h2>สมัครสมาชิก</h2>
      <form (ngSubmit)="onSubmit()">
        <label>ชื่อผู้ใช้</label>
        <input type="text" [(ngModel)]="username" name="username" required />

        <label>รหัสผ่าน</label>
        <input type="password" [(ngModel)]="password" name="password" required />

        <p class="error">@if (error) { {{ error }} }</p>
        <p class="success">@if (message) { {{ message }} }</p>

        <button type="submit">สมัครสมาชิก</button>
      </form>
      <p class="center">มีบัญชีอยู่แล้ว? <a routerLink="/login">เข้าสู่ระบบ</a></p>
    </div>
  `,
  styles: [`
    .card { width: 320px; margin: 100px auto; padding: 24px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h2 { text-align: center; }
    label { display: block; margin: 12px 0 4px; }
    input { width: 100%; padding: 8px; box-sizing: border-box; }
    button { width: 100%; margin-top: 16px; padding: 10px; background: #1976d2; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
    .error { color: #d32f2f; }
    .success { color: #2e7d32; }
    .center { text-align: center; }
  `],
})
export class RegisterComponent {
  username = '';
  password = '';
  error = '';
  message = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    this.error = '';
    this.message = '';
    this.auth.register(this.username, this.password).subscribe({
      next: (res) => {
        this.message = res.message ?? 'สมัครสมาชิกสำเร็จ';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.error = err.error?.message ?? 'สมัครสมาชิกไม่สำเร็จ';
      },
    });
  }
}