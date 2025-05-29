import bcrypt from "bcrypt";

export const hashToken = async (token: string) => {
  return await bcrypt.hash(token, 10);
};

export const compareHashedToken = async (
  token: string,
  hashedToken: string
) => {
  return await bcrypt.compare(token, hashedToken);
};
