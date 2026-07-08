// This file now only contains the isAdmin function for NextAuth compatibility
// All JWT functionality has been removed since we're using NextAuth


export function isAdmin(role: string): boolean {
  return role === 'ADMIN';
}