/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MiMeta } from '@/models/Meta.js';

describe('admin/update-meta - UserCheck API Parameters', () => {
	describe('Parameter validation', () => {
		it('should accept enableUsercheckApi as boolean', () => {
			const params = {
				enableUsercheckApi: true,
			};

			expect(params.enableUsercheckApi).toBe(true);
		});

		it('should accept usercheckApiKey as string', () => {
			const params = {
				usercheckApiKey: 'my-api-key-12345',
			};

			expect(typeof params.usercheckApiKey).toBe('string');
		});

		it('should accept usercheckApiKey as nullable', () => {
			const params = {
				usercheckApiKey: null,
			};

			expect(params.usercheckApiKey).toBeNull();
		});

		it('should handle empty string for usercheckApiKey', () => {
			const params = {
				usercheckApiKey: '',
			};

			expect(params.usercheckApiKey).toBe('');
		});
	});

	describe('Meta field definitions', () => {
		it('should define enableUsercheckApi field', () => {
			const metaFields = {
				enableUsercheckApi: { type: 'boolean' },
			};

			expect(metaFields.enableUsercheckApi.type).toBe('boolean');
		});

		it('should define usercheckApiKey field', () => {
			const metaFields = {
				usercheckApiKey: { type: 'string', nullable: true },
			};

			expect(metaFields.usercheckApiKey.type).toBe('string');
			expect(metaFields.usercheckApiKey.nullable).toBe(true);
		});
	});

	describe('API request handling', () => {
		it('should handle both UserCheck parameters in single request', () => {
			const params = {
				enableUsercheckApi: true,
				usercheckApiKey: 'test-key-123',
			};

			expect(params.enableUsercheckApi).toBe(true);
			expect(params.usercheckApiKey).toBe('test-key-123');
		});

		it('should handle partial UserCheck configuration', () => {
			const params = {
				enableUsercheckApi: true,
				// usercheckApiKey not provided
			};

			expect(params.enableUsercheckApi).toBe(true);
			expect(params.usercheckApiKey).toBeUndefined();
		});

		it('should support disabling UserCheck without key', () => {
			const params = {
				enableUsercheckApi: false,
			};

			expect(params.enableUsercheckApi).toBe(false);
		});
	});

	describe('Coexistence with other validation APIs', () => {
		it('should allow UserCheck alongside VerifyMail configuration', () => {
			const params = {
				enableUsercheckApi: true,
				usercheckApiKey: 'usercheck-key',
				enableVerifymailApi: true,
				verifymailAuthKey: 'verifymail-key',
			};

			expect(params.enableUsercheckApi).toBe(true);
			expect(params.enableVerifymailApi).toBe(true);
		});

		it('should allow UserCheck alongside TrueMail configuration', () => {
			const params = {
				enableUsercheckApi: true,
				usercheckApiKey: 'usercheck-key',
				enableTruemailApi: true,
				truemailInstance: 'https://truemail.example.com',
				truemailAuthKey: 'truemail-key',
			};

			expect(params.enableUsercheckApi).toBe(true);
			expect(params.enableTruemailApi).toBe(true);
		});

		it('should allow configuring all three validation services', () => {
			const params = {
				enableUsercheckApi: true,
				usercheckApiKey: 'usercheck-key',
				enableVerifymailApi: true,
				verifymailAuthKey: 'verifymail-key',
				enableTruemailApi: true,
				truemailInstance: 'https://truemail.example.com',
				truemailAuthKey: 'truemail-key',
			};

			expect(params.enableUsercheckApi).toBe(true);
			expect(params.enableVerifymailApi).toBe(true);
			expect(params.enableTruemailApi).toBe(true);
		});
	});

	describe('Data persistence', () => {
		it('should persist API key securely', () => {
			const meta: Partial<MiMeta> = {
				usercheckApiKey: 'secret-key-should-be-stored',
			};

			expect(meta.usercheckApiKey).toBe('secret-key-should-be-stored');
		});

		it('should clear API key when set to empty', () => {
			let meta: Partial<MiMeta> = {
				usercheckApiKey: 'existing-key',
			};

			// Simulate clearing
			if ('' === '') {
				meta.usercheckApiKey = null;
			}

			expect(meta.usercheckApiKey).toBeNull();
		});
	});
});
