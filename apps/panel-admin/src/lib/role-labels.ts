const roleLabels: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  EDITOR: "Editor",
  MEMBER: "Miembro",
  SUPER_ADMIN: "Super administrador",
  USER: "Usuario",
  owner: "Propietario",
  admin: "Administrador",
  editor: "Editor",
  member: "Miembro",
  user: "Usuario",
}

export function getRoleLabel(role?: string | null) {
  return role ? roleLabels[role] ?? role : "Miembro"
}
