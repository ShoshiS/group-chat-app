import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Entry point for authenticated users — immediately redirects to /groups.
 * Kept as a named route so guards apply before the redirect.
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: '',
})
export class Home implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.router.navigate(['/groups'], { replaceUrl: true });
  }
}
