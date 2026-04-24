import { json } from '@sveltejs/kit';
import { getAdminPassword, setAuthed } from '$lib/server/adminAuth';

export const POST = async ({ request, cookies }) => {
	const body = await request.json().catch(() => ({}));
	const password = body?.password;
	if (typeof password !== 'string') {
		return json({ error: 'Missing password' }, { status: 400 });
	}

	const expected = getAdminPassword();
	if (password !== expected) {
		return json({ error: 'Wrong password' }, { status: 401 });
	}

	setAuthed(cookies);
	return json({ ok: true });
};
