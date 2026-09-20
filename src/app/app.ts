import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <main>
      <router-outlet />
    </main>
  `,
  styles: [`
    :host { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    main { min-height: 100vh; }
  `],
})
export class App {
}