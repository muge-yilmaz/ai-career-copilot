import { z } from "zod";

export async function parseJsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<{ ok: true; data: z.output<TSchema> } | { ok: false; response: Response }> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return {
      ok: false,
      response: Response.json({ error: "Request body must be valid JSON." }, { status: 400 }),
    };
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid request body.";
    return {
      ok: false,
      response: Response.json({ error: message }, { status: 400 }),
    };
  }

  return { ok: true, data: result.data };
}
