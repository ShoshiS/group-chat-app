import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Toast } from '../../core/services/toast';
import { parseGroupAvatar, toGroupIconAvatar } from '../../core/utils/group-avatar';
import { GroupStore } from './group';
import { writeLastGroupId } from '../../core/utils/last-group';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

const GROUP_ICON_OPTIONS = [
  'groups',
  'forum',
  'chat',
  'school',
  'work',
  'sports_esports',
  'favorite',
  'star',
  'rocket_launch',
  'palette',
  'music_note',
  'code',
  'science',
  'local_cafe',
  'flight',
  'home',
  'pets',
  'celebration',
  'lightbulb',
  'eco',
] as const;

@Component({
  selector: 'app-group-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './group-form.html',
  styleUrl: './group-form.scss',
})
export class GroupForm implements OnInit {
  private readonly store = inject(GroupStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);

  protected readonly iconOptions = GROUP_ICON_OPTIONS;
  protected readonly isEdit = signal(false);
  protected readonly saving = signal(false);
  protected readonly avatarPreview = signal<string | null>(null);
  protected readonly selectedIcon = signal<string | null>(null);
  protected readonly avatarRemoved = signal(false);

  private editId = '';
  private existingAvatar = '';
  private pendingAvatar: File | null = null;
  private previewObjectUrl: string | null = null;

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId = id;
      const group = this.store.getById(id);
      if (group) {
        this.form.setValue({
          name: group.name,
          description: group.description ?? '',
        });
        this.existingAvatar = group.avatar ?? '';
        const parsed = parseGroupAvatar(group.avatar);
        if (parsed.type === 'icon') {
          this.selectedIcon.set(parsed.iconName ?? null);
        }
      }
    }
  }

  protected displayAvatar(): ReturnType<typeof parseGroupAvatar> {
    if (this.avatarPreview()) {
      return { type: 'image', imageUrl: this.avatarPreview()! };
    }
    if (this.selectedIcon()) {
      return { type: 'icon', iconName: this.selectedIcon()! };
    }
    if (!this.avatarRemoved() && this.existingAvatar) {
      return parseGroupAvatar(this.existingAvatar);
    }
    return { type: 'none' };
  }

  protected onAvatarPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      this.toast.error('Avatar must be a JPEG, PNG, GIF, or WebP image');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      this.toast.error('Avatar must be 10 MB or smaller');
      return;
    }

    this.clearPreview();
    this.selectedIcon.set(null);
    this.avatarRemoved.set(false);
    this.pendingAvatar = file;
    this.previewObjectUrl = URL.createObjectURL(file);
    this.avatarPreview.set(this.previewObjectUrl);
  }

  protected selectIcon(iconName: string): void {
    this.clearPreview();
    this.pendingAvatar = null;
    this.avatarRemoved.set(false);
    this.selectedIcon.set(iconName);
  }

  protected clearAvatar(): void {
    this.clearPreview();
    this.pendingAvatar = null;
    this.selectedIcon.set(null);
    this.avatarRemoved.set(true);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { name, description } = this.form.getRawValue();
    const payload: Parameters<GroupStore['create']>[0] = {
      name,
      ...(description ? { description } : {}),
    };

    if (this.pendingAvatar) {
      payload.avatarFile = this.pendingAvatar;
    } else if (this.selectedIcon()) {
      payload.avatar = toGroupIconAvatar(this.selectedIcon()!);
    } else if (this.avatarRemoved()) {
      payload.avatar = '';
    }

    try {
      if (this.isEdit()) {
        await this.store.update(this.editId, payload);
        this.toast.success('Group updated');
        void this.router.navigate(['/groups', this.editId]);
      } else {
        const group = await this.store.create(payload);
        this.toast.success('Group created');
        writeLastGroupId(group.id);
        void this.router.navigate(['/groups', group.id]);
      }
    } catch {
      this.toast.error('Failed to save group');
    } finally {
      this.saving.set(false);
    }
  }

  private clearPreview(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.avatarPreview.set(null);
  }
}
