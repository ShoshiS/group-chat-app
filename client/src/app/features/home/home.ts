import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Groups dashboard placeholder. GroupList / GroupCard land here in Slice 2 (Shoshi).
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
