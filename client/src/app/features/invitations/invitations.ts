import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { InvitationStore } from '../../core/services/invitation';
import { InvitationList } from './invitation-list';

@Component({
  selector: 'app-invitations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InvitationList, MatSnackBarModule],
  templateUrl: './invitations.html',
  styleUrl: './invitations.scss',
})
export class Invitations implements OnInit {
  protected readonly store = inject(InvitationStore);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    void this.store.load();
  }

  protected async onAccept(id: string): Promise<void> {
    try {
      await this.store.accept(id);
      this.snackBar.open('Invitation accepted', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Failed to accept invitation', 'OK', { duration: 3000 });
    }
  }

  protected async onReject(id: string): Promise<void> {
    if (!confirm('Reject this invitation?')) return;

    try {
      await this.store.reject(id);
      this.snackBar.open('Invitation rejected', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Failed to reject invitation', 'OK', { duration: 3000 });
    }
  }
}
