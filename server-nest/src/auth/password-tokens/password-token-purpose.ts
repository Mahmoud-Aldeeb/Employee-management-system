export enum PasswordTokenPurpose {
  INVITE = 'INVITE',
  RESET = 'RESET',
}

export const PASSWORD_TOKEN_TTL_S: Record<PasswordTokenPurpose, number> = {
  [PasswordTokenPurpose.INVITE]: 48 * 60 * 60,
  [PasswordTokenPurpose.RESET]: 60 * 60,
};
