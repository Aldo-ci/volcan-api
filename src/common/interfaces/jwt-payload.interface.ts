export interface JwtPayload {
  sub: string;
  username: string;
  roleId: string;
  roleCode: string;
}

export type AuthenticatedUser = JwtPayload;
