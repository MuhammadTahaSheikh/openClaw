import { apiFetch } from "./client";

export type Member = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  notes: string | null;
  createdBy: number | null;
  userId: number | null;
  inviteStatus: "pending" | "accepted";
  createdAt: string;
  updatedAt: string;
};

export async function fetchMembers(): Promise<Member[]> {
  const data = await apiFetch<{ members: Member[] }>("/api/members");
  return data.members;
}

export async function createMember(input: {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  notes?: string;
}): Promise<{ member: Member; inviteSent: boolean; message: string }> {
  const data = await apiFetch<{ member: Member; inviteSent: boolean; message: string }>("/api/members", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data;
}

export async function resendMemberInvite(memberId: number): Promise<{ member: Member; message: string }> {
  const data = await apiFetch<{ member: Member; message: string }>(`/api/members/${memberId}/resend-invite`, {
    method: "POST",
  });
  return data;
}
