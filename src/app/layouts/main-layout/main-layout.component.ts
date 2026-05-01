import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';
import { Popover, PopoverModule } from 'primeng/popover';

import { AuthService } from '../../core/auth/auth.service';
import { NotificationStore } from '../../core/notifications/notification.store';
import { ThemeService } from '../../core/theme/theme.service';
import { NotificationEvent } from '../../core/websocket/events';
import { StompService } from '../../core/websocket/stomp.service';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ButtonModule,
    BadgeModule,
    MenuModule,
    PopoverModule
  ],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly stomp = inject(StompService);
  private readonly messages = inject(MessageService);
  readonly notificationStore = inject(NotificationStore);

  readonly user = this.auth.user;
  readonly isDark = this.themeService.isDark;

  readonly userMenu = viewChild.required<Menu>('userMenu');
  readonly notifPanel = viewChild.required<Popover>('notifPanel');

  readonly themeIcon = computed(() => (this.isDark() ? 'pi pi-sun' : 'pi pi-moon'));

  readonly userMenuItems: MenuItem[] = [
    {
      label: 'Sign out',
      icon: 'pi pi-sign-out',
      command: () => this.signOut()
    }
  ];

  constructor() {
    this.stomp
      .watch<NotificationEvent>('/user/queue/notifications')
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        this.notificationStore.push(event);
        this.messages.add({
          severity: 'info',
          summary: this.notificationTitle(event),
          detail: event.message,
          life: 5000
        });
      });
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  openUserMenu(event: Event): void {
    this.userMenu().toggle(event);
  }

  openNotifications(event: Event): void {
    this.notifPanel().toggle(event);
    this.notificationStore.markAllRead();
  }

  notificationIcon(type: string): string {
    switch (type) {
      case 'ASSIGNED':
        return 'pi pi-user-plus';
      case 'UNASSIGNED':
        return 'pi pi-user-minus';
      case 'MENTIONED':
        return 'pi pi-at';
      case 'STATUS_CHANGED':
        return 'pi pi-arrow-right-arrow-left';
      default:
        return 'pi pi-bell';
    }
  }

  navigateToTicket(ticketId: string): void {
    this.notifPanel().hide();
    this.router.navigate(['/tickets', ticketId]);
  }

  private notificationTitle(event: NotificationEvent): string {
    switch (event.type) {
      case 'ASSIGNED':
        return 'Assigned to you';
      case 'UNASSIGNED':
        return 'Unassigned';
      case 'MENTIONED':
        return 'You were mentioned';
      case 'STATUS_CHANGED':
        return 'Status changed';
    }
  }

  private signOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
