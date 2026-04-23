import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';

import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ButtonModule, MenuModule],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  readonly user = this.auth.user;
  readonly isDark = this.themeService.isDark;

  readonly userMenu = viewChild.required<Menu>('userMenu');

  readonly themeIcon = computed(() => (this.isDark() ? 'pi pi-sun' : 'pi pi-moon'));

  readonly userMenuItems: MenuItem[] = [
    {
      label: 'Sign out',
      icon: 'pi pi-sign-out',
      command: () => this.signOut()
    }
  ];

  toggleTheme(): void {
    this.themeService.toggle();
  }

  openUserMenu(event: Event): void {
    this.userMenu().toggle(event);
  }

  private signOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
