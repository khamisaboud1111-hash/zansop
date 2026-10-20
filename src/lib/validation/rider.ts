import { z } from 'zod'

// East African phone format: optional +255/0 country prefix, then 9 digits.
// Accepts: +255712345678, 255712345678, 0712345678 — and tolerates spaces or
// dashes a person might type (0712 345 678, 0712-345-678), stripping them
// before the digits-only check instead of rejecting the input outright.
const eastAfricanPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .refine(
    (v) => /^(\+?255|0)[67]\d{8}$/.test(v),
    { message: 'Tafadhali weka namba sahihi ya simu (mfano: 0712345678 au +255712345678)' }
  )

export const riderApplicationSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Jina kamili linahitajika')
    .max(120, 'Jina ni refu mno'),
  phone_number: eastAfricanPhone,
  national_id: z
    .string()
    .trim()
    .min(5, 'Namba ya kitambulisho cha Taifa/Zanzibar si sahihi')
    .max(40, 'Namba ya kitambulisho ni ndefu mno'),
  driving_license: z
    .string()
    .trim()
    .min(3, 'Namba ya leseni ya udereva inahitajika')
    .max(40, 'Namba ya leseni ni ndefu mno'),
  motorcycle_registration: z
    .string()
    .trim()
    .min(3, 'Namba ya usajili wa pikipiki inahitajika')
    .max(20, 'Namba ya usajili ni ndefu mno')
    .regex(/^[A-Za-z0-9\s-]+$/, 'Namba ya usajili ina herufi zisizoruhusiwa'),
  emergency_contact: eastAfricanPhone,
  payout_method: z.enum(['mpesa', 'tigo_pesa', 'airtel_money', 'halopesa'], {
    errorMap: () => ({ message: 'Chagua njia sahihi ya malipo' }),
  }),
  payout_account_number: eastAfricanPhone,
  selfie_url: z.string().min(3, 'Picha ya selfie inahitajika').optional(),
  license_scan_url: z.string().min(3, 'Picha ya leseni inahitajika').optional(),
})

export type RiderApplicationInput = z.infer<typeof riderApplicationSchema>

// ─── Order / delivery lifecycle event payloads ──────────────────────────────

export const readyForPickupSchema = z.object({
  order_id: z.string().uuid('order_id si sahihi'),
  seller_id: z.string().uuid('seller_id si sahihi'),
  pickup_lat: z.number().min(-90).max(90),
  pickup_lng: z.number().min(-180).max(180),
  pickup_address: z.string().trim().min(3).max(300),
  delivery_lat: z.number().min(-90).max(90).optional(),
  delivery_lng: z.number().min(-180).max(180).optional(),
  delivery_address: z.string().trim().min(3).max(300),
  delivery_fee: z.number().int().min(0).max(200000),
})

export const acceptDeliverySchema = z.object({
  delivery_id: z.string().uuid('delivery_id si sahihi'),
})

export const declineDeliverySchema = z.object({
  delivery_id: z.string().uuid('delivery_id si sahihi'),
})

export const updateCoordinatesSchema = z.object({
  delivery_id: z.string().uuid('delivery_id si sahihi').optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const updateDeliveryStatusSchema = z.object({
  delivery_id: z.string().uuid('delivery_id si sahihi'),
  status: z.enum(['picked_up', 'delivered'], {
    errorMap: () => ({ message: 'Hali si sahihi' }),
  }),
})

