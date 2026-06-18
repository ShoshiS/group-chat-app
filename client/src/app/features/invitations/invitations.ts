import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-invitations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invitations.html',
  styleUrl: './invitations.scss',
})
export class Invitations {}
