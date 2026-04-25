import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';
import { StompService } from './core/websocket/stomp.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastModule, ConfirmDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly stomp = inject(StompService);

  constructor() {
    effect(() => {
      const token = this.auth.token();
      if (token) {
        this.stomp.connect(token);
      } else {
        this.stomp.disconnect();
      }
    });
  }
}
