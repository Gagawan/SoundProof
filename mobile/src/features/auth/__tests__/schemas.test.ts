import { loginSchema, registerSchema } from '../schemas';

describe('loginSchema', () => {
  it('accepte des identifiants valides', () => {
    const result = loginSchema.safeParse({
      email: 'marie@soundproof.fr',
      password: 'MotDePasseFort1',
    });

    expect(result.success).toBe(true);
  });

  it.each([
    ['email invalide', { email: 'pas-un-email', password: 'x' }],
    ['email manquant', { email: '', password: 'x' }],
    ['mot de passe vide', { email: 'marie@soundproof.fr', password: '' }],
  ])('rejette : %s', (_label, input) => {
    expect(loginSchema.safeParse(input).success).toBe(false);
  });
});

describe('registerSchema — politique de mot de passe (miroir de l’API)', () => {
  const validInput = {
    firstName: 'Marie',
    lastName: 'Dubois',
    email: 'marie@soundproof.fr',
    password: 'MotDePasseFort1',
    confirmPassword: 'MotDePasseFort1',
  };

  it('accepte une inscription valide', () => {
    expect(registerSchema.safeParse(validInput).success).toBe(true);
  });

  it.each([
    ['mot de passe trop court (< 12)', 'Court1court'],
    ['sans majuscule', 'motdepassefort1'],
    ['sans minuscule', 'MOTDEPASSEFORT1'],
    ['sans chiffre', 'MotDePasseFort'],
  ])('rejette un mot de passe %s', (_label, password) => {
    const result = registerSchema.safeParse({
      ...validInput,
      password,
      confirmPassword: password,
    });

    expect(result.success).toBe(false);
  });

  it('rejette une confirmation différente, avec l’erreur sur confirmPassword', () => {
    const result = registerSchema.safeParse({
      ...validInput,
      confirmPassword: 'AutreMotDePasse1',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['confirmPassword']);
      expect(result.error.issues[0].message).toBe('Les deux mots de passe ne correspondent pas.');
    }
  });

  it.each([
    ['prénom vide', { ...validInput, firstName: '  ' }],
    ['nom vide', { ...validInput, lastName: '' }],
    ['email invalide', { ...validInput, email: 'nope' }],
  ])('rejette : %s', (_label, input) => {
    expect(registerSchema.safeParse(input).success).toBe(false);
  });
});
