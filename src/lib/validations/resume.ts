import { z } from "zod";

// İzin verilen dosya tipleri ve maksimum boyut (5 MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

export const resumeUploadSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, "Please select a valid file.")
    .refine((file) => file.size <= MAX_FILE_SIZE, "File size cannot exceed 5MB.")
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Only PDF or DOCX files are supported."
    ),
  targetJobTitle: z
    .string()
    .min(2, "Target job title must be at least 2 characters long.")
    .max(100, "Target job title cannot exceed 100 characters.")
    .optional(),
});

export type ResumeUploadInput = z.infer<typeof resumeUploadSchema>;