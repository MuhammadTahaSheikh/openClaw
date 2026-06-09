import { apiFetch, setToken } from "./client";

export type User = {
  id: number;
  email: string;
  name: string;
  createdAt?: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function getMe(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/api/auth/me");
}

export async function register(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setToken(data.token);
  return data;
}

export type InviteDetails = {
  email: string;
  name: string;
  expiresAt: string;
};

export async function verifyInvite(token: string): Promise<InviteDetails> {
  const data = await apiFetch<{ invite: InviteDetails }>(`/api/auth/invite/${token}`);
  return data.invite;
}

export async function setPasswordFromInvite(
  token: string,
  password: string,
): Promise<AuthResponse & { message: string }> {
  const data = await apiFetch<AuthResponse & { message: string }>("/api/auth/set-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
  setToken(data.token);
  return data;
}
