export const GROUP_ICON_PREFIX = 'icon:';

export interface GroupAvatarDisplay {
  type: 'image' | 'icon' | 'none';
  imageUrl?: string;
  iconName?: string;
}

/** Parses a group avatar value — Cloudinary URL or `icon:<mat-icon-name>`. */
export function parseGroupAvatar(avatar?: string): GroupAvatarDisplay {
  if (!avatar) {
    return { type: 'none' };
  }

  if (avatar.startsWith(GROUP_ICON_PREFIX)) {
    return { type: 'icon', iconName: avatar.slice(GROUP_ICON_PREFIX.length) };
  }

  return { type: 'image', imageUrl: avatar };
}

export function toGroupIconAvatar(iconName: string): string {
  return `${GROUP_ICON_PREFIX}${iconName}`;
}
