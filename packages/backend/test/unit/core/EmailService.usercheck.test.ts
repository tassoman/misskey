/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailService } from '@/core/EmailService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { LoggerService } from '@/core/LoggerService.js';

describe('EmailService - UserCheck Integration', () => {
	let emailService: EmailService;
	let httpRequestService: HttpRequestService;
	let utilityService: UtilityService;
	let mockMeta: any;

	beforeEach(() => {
		// Mock dependencies
		httpRequestService = {
			send: vi.fn(),
		} as any;

		utilityService = {
			validateEmailFormat: vi.fn((email: string) => {
				return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
			}),
			isBlockedHost: vi.fn(() => false),
		} as any;

		const loggerService = {
			getLogger: vi.fn(() => ({
				info: vi.fn(),
				error: vi.fn(),
				warn: vi.fn(),
			})),
		} as any;

		mockMeta = {
			enableEmail: true,
			enableActiveEmailValidation: true,
			enableUsercheckApi: false,
			usercheckApiKey: null,
			enableVerifymailApi: false,
			verifymailAuthKey: null,
			enableTruemailApi: false,
			truemailInstance: null,
			truemailAuthKey: null,
			bannedEmailDomains: [],
		};

		const mockUserProfilesRepository = {
			countBy: vi.fn(async () => 0),
		} as any;

		const mockConfig = {
			url: 'http://localhost:3000',
		} as any;

		emailService = new EmailService(
			mockConfig,
			mockMeta,
			mockUserProfilesRepository,
			loggerService,
			utilityService,
			httpRequestService,
		);
	});

	describe('validateEmailForAccount with UserCheck API', () => {
		it('should return valid email when UserCheck API confirms it', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					email: 'user@example.com',
					is_disposable: false,
					is_forwarding: false,
					is_public_provider: false,
					mx_valid: true,
					domain_authority: 80,
					is_role_account: false,
				}),
			});

			const result = await emailService.validateEmailForAccount('user@example.com');

			expect(result.available).toBe(true);
			expect(result.reason).toBeNull();
		});

		it('should reject disposable email', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					email: 'user@tempmail.com',
					is_disposable: true,
					is_forwarding: false,
					is_public_provider: false,
					mx_valid: true,
					domain_authority: 0,
					is_role_account: false,
				}),
			});

			const result = await emailService.validateEmailForAccount('user@tempmail.com');

			expect(result.available).toBe(false);
			expect(result.reason).toBe('disposable');
		});

		it('should reject email with invalid MX records', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					email: 'user@invalid-domain.com',
					is_disposable: false,
					is_forwarding: false,
					is_public_provider: false,
					mx_valid: false,
					domain_authority: 0,
					is_role_account: false,
				}),
			});

			const result = await emailService.validateEmailForAccount('user@invalid-domain.com');

			expect(result.available).toBe(false);
			expect(result.reason).toBe('mx');
		});

		it('should reject email with forwarding service', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					email: 'user@forwarding-service.com',
					is_disposable: false,
					is_forwarding: true,
					is_public_provider: false,
					mx_valid: true,
					domain_authority: 50,
					is_role_account: false,
				}),
			});

			const result = await emailService.validateEmailForAccount('user@forwarding-service.com');

			expect(result.available).toBe(false);
			expect(result.reason).toBe('smtp');
		});

		it('should reject role account emails', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					email: 'support@example.com',
					is_disposable: false,
					is_forwarding: false,
					is_public_provider: false,
					mx_valid: true,
					domain_authority: 75,
					is_role_account: true,
				}),
			});

			const result = await emailService.validateEmailForAccount('support@example.com');

			expect(result.available).toBe(false);
			expect(result.reason).toBe('smtp');
		});

		it('should handle API error gracefully', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					error: 'Invalid API key',
				}),
			});

			const result = await emailService.validateEmailForAccount('user@example.com');

			expect(result.available).toBe(false);
			expect(result.reason).toBeNull();
		});

		it('should handle network errors', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			(httpRequestService.send as any).mockRejectedValueOnce(
				new Error('Network timeout'),
			);

			const result = await emailService.validateEmailForAccount('user@example.com');

			expect(result.available).toBe(false);
			expect(result.reason).toBeNull();
		});

		it('should send correct API request to UserCheck', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-key-123';

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					email: 'user@example.com',
					is_disposable: false,
					is_forwarding: false,
					is_public_provider: false,
					mx_valid: true,
					domain_authority: 85,
					is_role_account: false,
				}),
			});

			await emailService.validateEmailForAccount('user@example.com');

			expect(httpRequestService.send).toHaveBeenCalledWith(
				'https://api.usercheck.com/email',
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						'Authorization': 'Bearer test-key-123',
					}),
					body: expect.any(String),
				}),
			);

			const callArgs = (httpRequestService.send as any).mock.calls[0];
			const body = JSON.parse(callArgs[1].body);
			expect(body.email).toBe('user@example.com');
		});

		it('should not use UserCheck when disabled', async () => {
			mockMeta.enableActiveEmailValidation = false;
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			const result = await emailService.validateEmailForAccount('user@example.com');

			expect(result.available).toBe(true);
			expect(httpRequestService.send).not.toHaveBeenCalled();
		});

		it('should prioritize UserCheck over fallback validator', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					email: 'user@example.com',
					is_disposable: false,
					is_forwarding: false,
					is_public_provider: false,
					mx_valid: true,
					domain_authority: 90,
					is_role_account: false,
				}),
			});

			await emailService.validateEmailForAccount('user@example.com');

			expect(httpRequestService.send).toHaveBeenCalled();
		});

		it('should reject used email even when UserCheck validates it', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			const mockUserProfilesRepository = {
				countBy: vi.fn(async () => 1), // Email already exists
			} as any;

			// Re-create service with updated repository
			const loggerService = {
				getLogger: vi.fn(() => ({
					info: vi.fn(),
					error: vi.fn(),
					warn: vi.fn(),
				})),
			} as any;

			const mockConfig = {
				url: 'http://localhost:3000',
			} as any;

			const emailServiceWithUsedEmail = new EmailService(
				mockConfig,
				mockMeta,
				mockUserProfilesRepository,
				loggerService,
				utilityService,
				httpRequestService,
			);

			const result = await emailServiceWithUsedEmail.validateEmailForAccount('user@example.com');

			expect(result.available).toBe(false);
			expect(result.reason).toBe('used');
			expect(httpRequestService.send).not.toHaveBeenCalled();
		});

		it('should reject banned email domain', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';
			mockMeta.bannedEmailDomains = ['banned-domain.com'];

			(utilityService.isBlockedHost as any).mockReturnValueOnce(true);

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					email: 'user@banned-domain.com',
					is_disposable: false,
					is_forwarding: false,
					is_public_provider: false,
					mx_valid: true,
					domain_authority: 85,
					is_role_account: false,
				}),
			});

			const result = await emailService.validateEmailForAccount('user@banned-domain.com');

			expect(result.available).toBe(false);
			expect(result.reason).toBe('banned');
		});

		it('should handle invalid email format', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			const result = await emailService.validateEmailForAccount('invalid-email');

			expect(result.available).toBe(false);
			expect(result.reason).toBe('format');
			expect(httpRequestService.send).not.toHaveBeenCalled();
		});

		it('should handle missing email field in API response', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					is_disposable: false,
					mx_valid: true,
				}),
			});

			const result = await emailService.validateEmailForAccount('user@example.com');

			expect(result.available).toBe(false);
			expect(result.reason).toBeNull();
		});

		it('should validate email with high domain authority', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-api-key';

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					email: 'user@google.com',
					is_disposable: false,
					is_forwarding: false,
					is_public_provider: true,
					mx_valid: true,
					domain_authority: 100,
					is_role_account: false,
				}),
			});

			const result = await emailService.validateEmailForAccount('user@google.com');

			expect(result.available).toBe(true);
			expect(result.reason).toBeNull();
		});
	});

	describe('API request validation', () => {
		it('should construct proper request body', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-key';

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					email: 'test@test.com',
					is_disposable: false,
					is_forwarding: false,
					is_public_provider: false,
					mx_valid: true,
					domain_authority: 50,
					is_role_account: false,
				}),
			});

			await emailService.validateEmailForAccount('test@test.com');

			const [endpoint, options] = (httpRequestService.send as any).mock.calls[0];

			expect(endpoint).toBe('https://api.usercheck.com/email');
			expect(options.method).toBe('POST');
			expect(options.headers['Authorization']).toBe('Bearer test-key');

			const body = JSON.parse(options.body);
			expect(body).toEqual({ email: 'test@test.com' });
		});

		it('should use correct API endpoint', async () => {
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = 'test-key';

			(httpRequestService.send as any).mockResolvedValueOnce({
				json: async () => ({
					email: 'user@example.com',
					is_disposable: false,
					is_forwarding: false,
					is_public_provider: false,
					mx_valid: true,
					domain_authority: 75,
					is_role_account: false,
				}),
			});

			await emailService.validateEmailForAccount('user@example.com');

			const endpoint = (httpRequestService.send as any).mock.calls[0][0];
			expect(endpoint).toBe('https://api.usercheck.com/email');
		});
	});

	describe('fallback behavior', () => {
		it('should use fallback validator when UserCheck is not enabled', async () => {
			mockMeta.enableActiveEmailValidation = true;
			mockMeta.enableUsercheckApi = false;

			const result = await emailService.validateEmailForAccount('user@example.com');

			expect(result.available).toBe(true);
			expect(httpRequestService.send).not.toHaveBeenCalled();
		});

		it('should use fallback when UserCheck API key is missing', async () => {
			mockMeta.enableActiveEmailValidation = true;
			mockMeta.enableUsercheckApi = true;
			mockMeta.usercheckApiKey = null;

			const result = await emailService.validateEmailForAccount('user@example.com');

			expect(result.available).toBe(true);
			expect(httpRequestService.send).not.toHaveBeenCalled();
		});
	});
});
