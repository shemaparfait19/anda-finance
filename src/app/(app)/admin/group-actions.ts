'use server';

import { neon } from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

const sql = neon(process.env.DATABASE_URL!);

type FormState = { message: string; success?: boolean };

export async function createGroup(prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') return { message: 'Unauthorized.', success: false };

  const rawId = (formData.get('id') as string)?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const name  = (formData.get('name') as string)?.trim();
  const code  = (formData.get('code') as string)?.trim() || null;

  if (!rawId) return { message: 'Group ID is required.', success: false };
  if (!name)  return { message: 'Group name is required.', success: false };

  try {
    const existing = await sql`SELECT id FROM groups WHERE id = ${rawId}`;
    if (existing.length > 0) return { message: 'A group with this ID already exists.', success: false };

    await sql`INSERT INTO groups (id, name, code) VALUES (${rawId}, ${name}, ${code})`;
    revalidatePath('/admin');
    return { message: `Group "${name}" created.`, success: true };
  } catch (err: any) {
    return { message: err.message ?? 'Failed to create group.', success: false };
  }
}

export async function updateGroup(
  id: string,
  name: string,
  code: string | null
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') return { success: false, message: 'Unauthorized.' };

  try {
    await sql`UPDATE groups SET name = ${name}, code = ${code ?? null} WHERE id = ${id}`;
    revalidatePath('/admin');
    return { success: true, message: 'Group updated.' };
  } catch (err: any) {
    return { success: false, message: err.message ?? 'Failed to update group.' };
  }
}
