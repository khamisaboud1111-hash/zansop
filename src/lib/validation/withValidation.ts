import { NextResponse } from 'next/server'
import type { ZodSchema, ZodError } from 'zod'

export interface ValidationFailure {
  error: string
  details: { path: string; message: string }[]
}

function formatZodError(error: ZodError): ValidationFailure {
  return {
    error: 'Taarifa zilizotumwa si sahihi (validation failed)',
    details: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  }
}

/**
 * Wraps a Next.js Route Handler so the request body is parsed and validated
 * against the given Zod schema before the handler logic runs. On failure,
 * returns a structured 400 Bad Request immediately — the handler is never called.
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (data: T, req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Mwili wa ombi (request body) si JSON sahihi' },
        { status: 400 }
      )
    }

    const result = schema.safeParse(rawBody)
    if (!result.success) {
      return NextResponse.json(formatZodError(result.error), { status: 400 })
    }

    try {
      return await handler(result.data, req)
    } catch (err) {
      console.error('[withValidation] handler error:', err)
      return NextResponse.json(
        { error: 'Hitilafu ya ndani ya seva (internal server error)' },
        { status: 500 }
      )
    }
  }
}

