import { z } from 'zod';

// Reservation validation schema
export const reservationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  email: z.string().email('Invalid email address').max(255, 'Email too long').trim(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  guests: z.number().int().min(1, 'At least 1 guest required').max(50, 'Maximum 50 guests'),
});

export type ReservationInput = z.infer<typeof reservationSchema>;

// Validate reservation data from AI response
export const validateReservationData = (data: unknown): { success: boolean; data?: ReservationInput; error?: string } => {
  try {
    const parsed = reservationSchema.parse(data);
    
    // Additional date validation - not in the past
    const reservationDate = new Date(parsed.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (reservationDate < today) {
      return { success: false, error: 'Reservation date cannot be in the past' };
    }
    
    return { success: true, data: parsed };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { success: false, error: e.errors[0]?.message || 'Invalid data' };
    }
    return { success: false, error: 'Validation failed' };
  }
};
