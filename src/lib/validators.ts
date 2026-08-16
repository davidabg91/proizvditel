import { z } from "zod";
import { REGIONS, CATEGORIES, YIELD_UNITS, UNITS, FORUM_CATEGORIES, BLOG_CATEGORIES } from "@/lib/constants";

const currentYear = new Date().getFullYear();

export const cropSchema = z.object({
  name: z.string().trim().min(2, "Въведете култура").max(80),
  category: z.enum(CATEGORIES).optional().or(z.literal("")),
  varieties: z.string().trim().max(300).optional().or(z.literal("")),
  sinceYear: z
    .number()
    .int()
    .min(1900)
    .max(currentYear)
    .optional()
    .nullable(),
  decares: z.number().min(0).max(1_000_000).optional().nullable(),
  annualYield: z.number().min(0).max(100_000_000).optional().nullable(),
  yieldUnit: z.enum(YIELD_UNITS).optional().or(z.literal("")),
});

export const registerSchema = z.object({
  // Акаунт
  farmName: z.string().trim().min(2, "Въведете име на стопанството").max(120),
  ownerName: z.string().trim().min(2, "Въведете име на собственика").max(120),
  email: z.string().trim().toLowerCase().email("Невалиден имейл"),
  password: z.string().min(8, "Паролата трябва да е поне 8 символа").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),

  // Данни за ЗП
  urn: z.string().trim().max(40).optional().or(z.literal("")),
  region: z.enum(REGIONS).optional().or(z.literal("")),
  town: z.string().trim().max(120).optional().or(z.literal("")),

  // Обобщение
  startedYear: z.number().int().min(1900).max(currentYear).optional().nullable(),
  totalDecares: z.number().min(0).max(1_000_000).optional().nullable(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),

  crops: z.array(cropSchema).max(30).default([]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type CropInput = z.infer<typeof cropSchema>;

export const profileSchema = z.object({
  farmName: z.string().trim().min(2, "Въведете име на стопанството").max(120),
  ownerName: z.string().trim().min(2, "Въведете име на собственика").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  urn: z.string().trim().max(40).optional().or(z.literal("")),
  region: z.enum(REGIONS).optional().or(z.literal("")),
  town: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  contactEmail: z.string().trim().email("Невалиден имейл").optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  startedYear: z.number().int().min(1900).max(currentYear).optional().nullable(),
  totalDecares: z.number().min(0).max(1_000_000).optional().nullable(),
  sharedDelivery: z.boolean().default(false),
  deliveryProviders: z.array(z.string().max(20)).max(10).default([]),
  logoUrl: z.string().trim().max(400).optional().or(z.literal("")),
  coverUrl: z.string().trim().max(400).optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const listingSchema = z.object({
  title: z.string().trim().min(2, "Въведете заглавие").max(140),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  category: z.enum(CATEGORIES).optional().or(z.literal("")),
  price: z.number({ message: "Въведете цена" }).min(0).max(1_000_000),
  oldPrice: z.number().min(0).max(1_000_000).optional().nullable(),
  unit: z.enum(UNITS),
  currency: z.enum(["BGN", "EUR"]).default("BGN"),
  available: z.boolean().default(true),
  isOffer: z.boolean().default(false),
  stockNote: z.string().trim().max(200).optional().or(z.literal("")),
  photos: z.array(z.string().trim().max(400)).max(8).default([]),
});

export type ListingInput = z.infer<typeof listingSchema>;

export const paymentSchema = z.object({
  acceptsBankTransfer: z.boolean().default(false),
  bankName: z.string().trim().max(120).optional().or(z.literal("")),
  bankIban: z.string().trim().max(60).optional().or(z.literal("")),
  bankHolder: z.string().trim().max(120).optional().or(z.literal("")),
  acceptsRevolut: z.boolean().default(false),
  revolutLink: z.string().trim().max(300).optional().or(z.literal("")),
  acceptsCod: z.boolean().default(false),
  codNote: z.string().trim().max(200).optional().or(z.literal("")),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const customerRegisterSchema = z.object({
  name: z.string().trim().min(2, "Въведете вашето име").max(120),
  email: z.string().trim().toLowerCase().email("Невалиден имейл"),
  password: z.string().min(8, "Паролата трябва да е поне 8 символа").max(200),
});

export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Изберете оценка").max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const forumTopicSchema = z.object({
  title: z.string().trim().min(5, "Заглавието е твърде кратко").max(160),
  category: z.enum(FORUM_CATEGORIES),
  body: z.string().trim().min(10, "Съобщението е твърде кратко").max(8000),
});

export type ForumTopicInput = z.infer<typeof forumTopicSchema>;

export const forumReplySchema = z.object({
  body: z.string().trim().min(2, "Съобщението е твърде кратко").max(8000),
});

export const blogPostSchema = z.object({
  title: z.string().trim().min(5, "Заглавието е твърде кратко").max(160),
  category: z.enum(BLOG_CATEGORIES),
  excerpt: z.string().trim().max(300).optional().or(z.literal("")),
  body: z.string().trim().min(30, "Съдържанието е твърде кратко").max(20000),
  coverUrl: z.string().trim().max(400).optional().or(z.literal("")),
  published: z.boolean().default(true),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Невалиден имейл"),
  password: z.string().min(1, "Въведете парола"),
});
