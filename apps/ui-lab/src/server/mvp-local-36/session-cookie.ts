/** Transport only: authentication remains in ValidateCustomerSession. */
export const readSessionCookie = (request: Request): string => {
  const values = (request.headers.get('cookie') ?? '').split(';')
    .map(part => part.trim()).filter(part => part.startsWith('hielya_session='));
  return values.length === 1 ? values[0].slice('hielya_session='.length) : '';
};
export const sessionCookie = (token: string, maxAge: number): string =>
  `hielya_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
