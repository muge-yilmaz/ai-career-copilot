import { z } from "zod";

const MAX_MESSAGES = 200;
const MAX_MESSAGE_LENGTH = 20_000;

export const interviewMessageSchema = z.object({
  id: z.string().trim().min(1, "Message id is required.").max(128),
  role: z.enum(["user", "assistant"]),
  content: z.string().max(MAX_MESSAGE_LENGTH, "Message content is too long."),
});

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid session id.");

const roleTitleSchema = z
  .string()
  .trim()
  .min(1, "Role title is required.")
  .max(100, "Role title cannot exceed 100 characters.");

export const interviewRequestSchema = z
  .object({
    messages: z.array(interviewMessageSchema).max(MAX_MESSAGES, "Too many messages."),
    roleTitle: roleTitleSchema.optional(),
    sessionId: objectIdSchema.nullable().optional(),
    isFinished: z.boolean().optional().default(false),
  })
  .refine((data) => !data.isFinished || Boolean(data.sessionId), {
    message: "A session id is required to save a finished interview.",
    path: ["sessionId"],
  })
  .refine((data) => data.isFinished || data.messages.length > 0, {
    message: "At least one message is required.",
    path: ["messages"],
  })
  .refine((data) => {
    if (data.isFinished) return true;
    const lastMessage = data.messages.at(-1);
    return Boolean(lastMessage && lastMessage.role === "user" && lastMessage.content.trim().length > 0);
  }, {
    message: "The latest message must be a non-empty user message.",
    path: ["messages"],
  });

export const interviewEvaluationRequestSchema = z.object({
  sessionId: objectIdSchema.nullable().optional(),
  roleTitle: roleTitleSchema.optional(),
  messages: z
    .array(interviewMessageSchema)
    .min(1, "No interview content to evaluate.")
    .max(MAX_MESSAGES, "Too many messages."),
});

export type InterviewMessage = z.infer<typeof interviewMessageSchema>;
export type InterviewRequest = z.infer<typeof interviewRequestSchema>;
export type InterviewEvaluationRequest = z.infer<typeof interviewEvaluationRequestSchema>;
