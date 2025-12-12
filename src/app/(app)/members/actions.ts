"use server";

import { z } from "zod";
import {
  addMember as addMemberToDb,
  updateMember as updateMemberInDb,
  createSavingsAccount,
} from "@/lib/data-service";
import { revalidatePath } from "next/cache";
import type { Member } from "@/lib/types";

const AddMemberFormSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters." }),
  middleName: z.string().optional(),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters." }),
  dateOfBirth: z.string().refine((date) => {
    if (!date) return true;
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 18 && age <= 100;
  }, { message: "Member must be between 18 and 100 years old." }).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  nationalId: z.string().optional(),
  phoneNumber: z.string().min(10, { message: "Phone number is required." }),
  email:
    z.string().email({ message: "Invalid email address." }).optional().or(z.literal("")),
  alternativePhone: z.string().optional(),
  // Location
  province: z.string().optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  cell: z.string().optional(),
  village: z.string().optional(),
  address: z.string().optional(),
  // Next of Kin
  nextOfKinName: z.string().min(2, { message: "Next of kin name is required." }),
  nextOfKinPhone: z.string().min(10, { message: "Next of kin phone is required." }),
  nextOfKinRelationship: z.string().min(2, { message: "Relationship is required." }),
  // Shares/Contribution
  monthlyContribution: z.coerce.number().min(15000, { message: "Monthly contribution must be at least 15,000 RWF." }),
  contributionDate: z.string().refine((date) => {
    if (!date) return true;
    const contributionDate = new Date(date);
    const today = new Date();
    // Set time to 00:00:00 for both dates to compare only the date part
    contributionDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return contributionDate >= today;
  }, { message: "Contribution date must be today or in the future." }).optional(),
  collectionMeans: z.enum(["MOMO", "AIRTEL MONEY", "BANKS IN RWANDA", "BANKS OUTSIDE RWANDA"]).optional(),
  otherCollectionMeans: z.string().optional(),
  accountNumber: z.string().optional(),
});

const EditMemberFormSchema = z.object({
  id: z.string(),
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters." }),
  middleName: z.string().optional(),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters." }),
  dateOfBirth: z.string().refine((date) => {
    if (!date) return true;
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 18 && age <= 100;
  }, { message: "Member must be between 18 and 100 years old." }).optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  nationalId: z.string().optional(),
  phoneNumber: z.string().min(10, { message: "Phone number is required." }),
  email:
    z.string().email({ message: "Invalid email address." }).optional().or(z.literal("")),
  alternativePhone: z.string().optional(),
  // Location
  province: z.string().optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  cell: z.string().optional(),
  village: z.string().optional(),
  address: z.string().optional(),
  // Next of Kin
  nextOfKinName: z.string().min(2, { message: "Next of kin name is required." }),
  nextOfKinPhone: z.string().min(10, { message: "Next of kin phone is required." }),
  nextOfKinRelationship: z.string().min(2, { message: "Relationship is required." }),
  // Shares/Contribution
  monthlyContribution: z.coerce.number().min(15000, { message: "Monthly contribution must be at least 15,000 RWF." }),
  contributionDate: z.string().refine((date) => {
    if (!date) return true;
    const contributionDate = new Date(date);
    const today = new Date();
    // Set time to 00:00:00 for both dates to compare only the date part
    contributionDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return contributionDate >= today;
  }, { message: "Contribution date must be today or in the future." }).optional(),
  collectionMeans: z.enum(["MOMO", "AIRTEL MONEY", "BANKS IN RWANDA", "BANKS OUTSIDE RWANDA"]).optional(),
  otherCollectionMeans: z.string().optional(),
  accountNumber: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Temporary Inactive", "Dormant", "Closed"]),
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

    // Calculate number of shares from monthly contribution (each share = 15000 RWF)
    // Formula: Monthly Contribution ÷ Price per share
    // Example: 45,000 / 15,000 = 3.00 shares
    // Example: 32,000 / 15,000 = 2.13 shares
    const numberOfShares = parseFloat((memberData.monthlyContribution / 15000).toFixed(2));

    // Build full name with middle name if provided
    const fullName = memberData.middleName 
      ? `${memberData.firstName} ${memberData.middleName} ${memberData.lastName}`
      : `${memberData.firstName} ${memberData.lastName}`;

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
        numberOfShares,
        joinDate: new Date().toISOString().split("T")[0], // Explicitly set joinDate for type compatibility
    };

    await addMemberToDb({
      ...newMember,
      name: fullName,
      savingsBalance: 0,
      loanBalance: 0,
      status: "Active",
      avatarId: `avatar${Math.floor(Math.random() * 5) + 1}`,
    });

    // Auto-create Compulsory savings account for new member
    try {
      await createSavingsAccount(memberId, "Compulsory", "Compulsory Savings");
    } catch (accountError) {
      console.error("Failed to create compulsory account:", accountError);
      // Don't fail member creation if account creation fails
      // Member is created, account can be created manually later
    }

    revalidatePath("/members");
    revalidatePath("/savings"); // Also revalidate savings page

    return {
        message: "Member added successfully.",
        success: true,
    };
  } catch (e) {
    const error = e as Error;
    console.error("addMember error:", error);
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
        
        // Calculate number of shares from monthly contribution
        // Formula: Monthly Contribution ÷ Price per share
        const numberOfShares = updates.monthlyContribution ? parseFloat((updates.monthlyContribution / 15000).toFixed(2)) : undefined;
        
        // Build full name with middle name if provided
        const fullName = updates.middleName 
          ? `${updates.firstName} ${updates.middleName} ${updates.lastName}`
          : `${updates.firstName} ${updates.lastName}`;
        
        await updateMemberInDb(id, {
            ...updates,
            numberOfShares,
            name: fullName,
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

export async function deactivateMember(memberId: string, reason: string): Promise<FormState> {
    try {
    await updateMemberInDb(memberId, { status: "Temporary Inactive", deactivationReason: reason });
    revalidatePath("/members");
    return { message: "Member has been temporarily deactivated.", success: true };
    } catch (e) {
        const error = e as Error;
    return {
      message: error.message || "An unexpected error occurred.",
      success: false,
    };
    }
}



export async function reactivateMember(memberId: string, reason: string): Promise<FormState> {
    try {
    await updateMemberInDb(memberId, { status: "Active", deactivationReason: reason });
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

export async function closeMembership(memberId: string, reason: string): Promise<FormState> {
    try {
    await updateMemberInDb(memberId, { status: "Closed", deactivationReason: reason });
    revalidatePath("/members");
    return { message: "Membership has been closed.", success: true };
    } catch (e) {
        const error = e as Error;
    return {
      message: error.message || "An unexpected error occurred.",
      success: false,
    };
    }
}
