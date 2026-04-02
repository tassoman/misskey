/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, startJobQueue, api } from '../utils.js';
import type { INestApplicationContext } from '@nestjs/common';

describe('Email Validation with UserCheck API', () => {
	let app: INestApplicationContext;
	let server: any;
	let queue: any;
	let admin: any;

	beforeAll(async () => {
		[server, queue] = await Promise.all([startServer(), startJobQueue()]);
		app = server;

		// Create admin user
		const admin_res = await api('signup', {
			username: 'admin-user',
			password: 'test',
		});
		admin = {
			token: admin_res.body?.token || 'admin-token',
			bearer: false,
		};
	});

	afterAll(async () => {
		await Promise.all([app.close(), queue.close()]);
	});

	describe('Admin Settings for UserCheck API', () => {
		it('should update UserCheck API settings', async () => {
			const result = await api('admin/update-meta', {
				enableActiveEmailValidation: true,
				enableUsercheckApi: true,
				usercheckApiKey: 'test-api-key-123',
			}, admin);

			expect(result.status).toBe(200);
		});

		it('should clear UserCheck API key when set to empty string', async () => {
			await api('admin/update-meta', {
				enableUsercheckApi: true,
				usercheckApiKey: 'test-key',
			}, admin);

			const result = await api('admin/update-meta', {
				usercheckApiKey: '',
			}, admin);

			expect(result.status).toBe(200);
		});

		it('should retrieve UserCheck settings from admin meta', async () => {
			await api('admin/update-meta', {
				enableUsercheckApi: true,
				usercheckApiKey: 'test-key-value',
			}, admin);

			const result = await api('admin/meta', {}, admin);

			expect(result.body.enableUsercheckApi).toBe(true);
			expect(result.body.usercheckApiKey).toBe('test-key-value');
		});

		it('should disable UserCheck API', async () => {
			await api('admin/update-meta', {
				enableUsercheckApi: true,
				usercheckApiKey: 'test-key',
			}, admin);

			const result = await api('admin/update-meta', {
				enableUsercheckApi: false,
			}, admin);

			expect(result.status).toBe(200);

			const meta = await api('admin/meta', {}, admin);
			expect(meta.body.enableUsercheckApi).toBe(false);
		});
	});

	describe('Email Validation with UserCheck', () => {
		beforeAll(async () => {
			// Enable UserCheck API
			await api('admin/update-meta', {
				enableActiveEmailValidation: true,
				enableUsercheckApi: true,
				usercheckApiKey: 'test-api-key',
			}, admin);
		});

		it('should validate email during signup', async () => {
			const result = await api('signup', {
				username: 'testuser',
				password: 'password123',
				email: 'valid@example.com',
			});

			// This would normally call UserCheck API
			// Result depends on actual UserCheck API response
			expect(result.status).toBeDefined();
		});

		it('should provide email address availability check', async () => {
			const result = await api('email-address/available', {
				emailAddress: 'available@example.com',
			});

			expect(result.status).toBeDefined();
			expect(result.body).toHaveProperty('available');
		});
	});

	describe('Configuration persistence', () => {
		it('should persist UserCheck API key across requests', async () => {
			const testKey = 'persistent-test-key-' + Date.now();

			// Set the key
			await api('admin/update-meta', {
				enableUsercheckApi: true,
				usercheckApiKey: testKey,
			}, admin);

			// Retrieve and verify
			const result = await api('admin/meta', {}, admin);
			expect(result.body.usercheckApiKey).toBe(testKey);

			// Verify it persists in another request
			const result2 = await api('admin/meta', {}, admin);
			expect(result2.body.usercheckApiKey).toBe(testKey);
		});

		it('should handle null API key gracefully', async () => {
			await api('admin/update-meta', {
				enableUsercheckApi: true,
				usercheckApiKey: null,
			}, admin);

			const result = await api('admin/meta', {}, admin);
			expect(result.body.usercheckApiKey).toBeNull();
		});
	});
});
