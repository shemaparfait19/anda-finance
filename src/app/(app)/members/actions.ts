"use server";

import { z } from "zod";
import {
  addMember as addMemberToDb,
  updateMember as updateMemberInDb,
} from "@/lib/data-service";
import { revalidatePath } from "next/cache";
import type { Member } from "@/lib/types";

const AddMemberFormSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters." }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters." }),
    dateOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
    nationalId: z.string().optional(),
  phoneNumber: z.string().min(10, { message: "Phone number is required." }),
  email:
    z.string().email({ message: "Invalid email address." }).optional().or(z.literal("")),
  alternativePhone: z.string().optional(),
  address: z.string().optional(),
  monthlyContribution: z.coerce.number().optional(),
  contributionDate: z.string().optional(),
  collectionMeans: z.enum(["MOMO", "AIRTEL MONEY", "BANKS IN RWANDA", "OTHER"]).optional(),
  otherCollectionMeans: z.string().optional(),
  accountNumber: z.string().optional(),
    // We are not handling file uploads in this action for now
    // profilePhoto: z.any().optional(),
    // nationalIdCopy: z.any().optional(),
});

const EditMemberFormSchema = AddMemberFormSchema.extend({
    id: z.string(),
  status: z.enum(["Active", "Inactive", "Dormant", "Closed"]),
});

type FormState = {
    message: string;
    fields?: Record<string, string>;
    success?: boolean;
};

// Helper function to generate sequential member ID
async function generateMemberId(): Promise<string> {
    // Get the count of existing members to determine the next sequential number
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL!);

    try {
        const result = await sql`SELECT COUNT(*) as count FROM members`;
        const count = parseInt(result[0].count) + 1; // Next sequential number
        return `BIF${count.toString().padStart(3, '0')}`;
    } catch (error) {
        // Fallback in case of error
        return `BIF${Date.now().toString().slice(-3)}`;
    }
}

export async function addMember(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = Object.fromEntries(formData);
    const parsed = AddMemberFormSchema.safeParse(rawData);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const key in parsed.error.format()) {
        if (key !== "_errors") {
            fields[key] = (parsed.error.format() as any)[key]?._errors.join(", ");
        }
      }
      return {
        message: "Invalid form data. Please check the fields.",
        fields,
        success: false,
      };
    }
    
    // In a real app, you would handle file uploads here and get back file paths.
    // For now, we'll just use the data.
    // const { profilePhoto, nationalIdCopy, ...memberData } = parsed.data;

    const memberData = parsed.data;

    // Generate sequential member ID
    const memberId = await generateMemberId();

    const newMember: Omit<
      Member,
      | "id"
      | "savingsBalance"
      | "loanBalance"
      | "status"
      | "name"
      | "avatarId"
    > = {
        ...memberData,
        memberId,
    };

    await addMemberToDb({
      ...newMember,
      name: `${newMember.firstName} ${newMember.lastName}`,
      savingsBalance: 0,
      loanBalance: 0,
      status: "Active",
      avatarId: `avatar${Math.floor(Math.random() * 5) + 1}`,
    });

    revalidatePath("/members");

    return {
        message: "Member added successfully.",
        success: true,
    };
  } catch (e) {
    const error = e as Error;
    return {
      message: error.message || "An unexpected error occurred.",
        success: false,
    };
  }
}

export async function editMember(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
    try {
        const rawData = Object.fromEntries(formData);
        const parsed = EditMemberFormSchema.safeParse(rawData);

        if (!parsed.success) {
            const fields: Record<string, string> = {};
             for (const key in parsed.error.format()) {
                if (key !== "_errors") {
                    fields[key] = (parsed.error.format() as any)[key]?._errors.join(", ");
                }
            }
      return { message: "Invalid form data.", fields, success: false };
        }

        const { id, ...updates } = parsed.data;
        await updateMemberInDb(id, {
            ...updates,
      name: `${updates.firstName} ${updates.lastName}`,
        });

    revalidatePath("/members");
        revalidatePath(`/members/${id}`);
    return { message: "Member updated successfully.", success: true };
    } catch (e) {
        const error = e as Error;
    return {
      message: error.message || "An unexpected error occurred.",
      success: false,
    };
    }
}

export async function deactivateMember(memberId: string): Promise<FormState> {
    try {
    await updateMemberInDb(memberId, { status: "Inactive" });
    revalidatePath("/members");
    return { message: "Member has been deactivated.", success: true };
    } catch (e) {
        const error = e as Error;
    return {
      message: error.message || "An unexpected error occurred.",
      success: false,
    };
    }
}

export async function reactivateMember(memberId: string): Promise<FormState> {
    try {
    await updateMemberInDb(memberId, { status: "Active" });
    revalidatePath("/members");
    return { message: "Member has been reactivated.", success: true };
    } catch (e) {
        const error = e as Error;
    return {
      message: error.message || "An unexpected error occurred.",
      success: false,
    };
    }
}
