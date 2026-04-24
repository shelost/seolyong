import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';

const COOKIE_NAME = 'seolyong_admin';

export function getAdminPassword(): string {
	const pw = process.env.SEOLYONG_ADMIN_PASSWORD;
	if (!pw) {
		if (dev) {
			throw error(500, 'Missing SEOLYONG_ADMIN_PASSWORD in env');
		}
		// In prod, fail closed but avoid leaking details
		throw error(500, 'Admin not configured');
	}
	return pw;
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
