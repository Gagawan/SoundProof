import { z } from 'zod';

/** Schémas de validation des formulaires d'authentification (miroir des DTOs API). */

export const loginSchema = z.object({
  email: z.email("L'adresse email est invalide."),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Le prénom est requis.').max(100),
    lastName: z.string().trim().min(1, 'Le nom est requis.').max(100),
    email: z.email("L'adresse email est invalide."),
    password: z
      .string()
      .min(12, 'Le mot de passe doit contenir au moins 12 caractères.')
      .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères.')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
        'Le mot de passe doit contenir une minuscule, une majuscule et un chiffre.',
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les deux mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });

export type RegisterForm = z.infer<typeof registerSchema>;
