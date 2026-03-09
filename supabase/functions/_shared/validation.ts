import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Reservation validation schema - shared across edge functions
export const ReservationArgsSchema = z.object({
  name: z.string().min(1, "Name required").max(100, "Name too long").trim(),
  email: z.string().email("Invalid email").max(255, "Email too long").trim(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be HH:MM or HH:MM:SS"),
  guests: z.number().int().min(1, "At least 1 guest").max(50, "Max 50 guests"),
});

export type ReservationArgs = z.infer<typeof ReservationArgsSchema>;

// Validate reservation date is not in the past
export function validateReservationDate(date: string): { valid: boolean; error?: string } {
  const reservationDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(reservationDate.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }
  
  if (reservationDate < today) {
    return { valid: false, error: "Reservation date cannot be in the past" };
  }
  
  return { valid: true };
}

// Full reservation validation including date check
export function validateReservation(args: unknown): {
  success: true;
  data: ReservationArgs;
} | {
  success: false;
  errors: string[];
} {
  const parseResult = ReservationArgsSchema.safeParse(args);
  
  if (!parseResult.success) {
    return {
      success: false,
      errors: parseResult.error.errors.map(e => e.message),
    };
  }
  
  const dateValidation = validateReservationDate(parseResult.data.date);
  if (!dateValidation.valid) {
    return {
      success: false,
      errors: [dateValidation.error!],
    };
  }
  
  return {
    success: true,
    data: parseResult.data,
  };
}
