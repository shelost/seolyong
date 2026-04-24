const COOKIE_NAME = 'seolyong_admin';

const DEFAULT_PASSWORD = 'sesame';

export function getAdminPassword(): string {
	return process.env.SEOLYONG_ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

export function isAuthed(cookies: { get: (name: string) => string | undefined }) {
	return cookies.get(COOKIE_NAME) === '1';
}

export function setAuthed(cookies: { set: (name: string, value: string, opts: any) => void }) {
	cookies.set(COOKIE_NAME, '1', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: 60 * 60 * 24 * 30
	});
}

export function clearAuthed(cookies: { delete: (name: string, opts: any) => void }) {
	cookies.delete(COOKIE_NAME, { path: '/' });
}
