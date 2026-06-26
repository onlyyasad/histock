import type { ConfigurablePermission, ConfigurableRole } from './team.constants'

export type ICreateInviteInput = {
  email: string
  role: ConfigurableRole
}

export type IAcceptInviteInput = {
  name: string
  password: string
}

export type IUpdateRoleInput = {
  role: ConfigurableRole
}

export type IUpdatePermissionInput = {
  role: ConfigurableRole
  permission: ConfigurablePermission
  granted: boolean
}
