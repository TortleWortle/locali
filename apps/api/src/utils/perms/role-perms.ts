import type { AppRoles, OrgRoles, ProjRoles } from './roles';

type Roles = AppRoles | OrgRoles | ProjRoles;

export const basePerms: string[] = ['CREATE:/user'];

export const baseUserPerms: string[] = ['CREATE:/organisation'];

export const rolePerms: Record<Roles, string[]> = {
  'app:admin': [
    'LIST:/user',
    'READ:/user/*',
    'LIST:/organisation',
    'DELETE:/organisation/*',
  ],
  'app:support': ['LIST:/user', 'READ:/user/*', 'LIST:/organisation'],
  'org:admin': [
    'DELETE:/organisation/{org}',
    'LIST:/organisation/{org}/projects',
    'CREATE:/organisation/{org}/projects',
    'READ:/organisation/{org}/projects/*',
    'DELETE:/organisation/{org}/projects/*',
    'DELETE:/organisation/{org}/members/*',
    'READ:/organisation/{org}/members/*',
    'LIST:/organisation/{org}/members',
    'CREATE:/organisation/{org}/members',
  ],
  'org:translator': [],
  'proj:admin': [],
  'proj:maintainer': [],
  'proj:translator': [],
};
