/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Mock configuration and utilities for EmailService tests
 */

export const createMockMeta = (overrides?: Partial<any>) => ({
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
	...overrides,
});

export const createMockHttpRequestService = () => ({
	send: vi.fn(),
});

export const createMockUtilityService = () => ({
	validateEmailFormat: vi.fn((email: string) => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}),
	isBlockedHost: vi.fn(() => false),
});

export const createMockLoggerService = () => ({
	getLogger: vi.fn(() => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
	})),
});

export const createMockUserProfilesRepository = () => ({
	countBy: vi.fn(async () => 0),
});

export const USERCHECK_TEST_RESPONSES = {
	validEmail: {
		email: 'user@example.com',
		is_disposable: false,
		is_forwarding: false,
		is_public_provider: false,
		mx_valid: true,
		domain_authority: 80,
		is_role_account: false,
	},
	disposableEmail: {
		email: 'user@tempmail.com',
		is_disposable: true,
		is_forwarding: false,
		is_public_provider: false,
		mx_valid: true,
		domain_authority: 0,
		is_role_account: false,
	},
	invalidMx: {
		email: 'user@invalid.com',
		is_disposable: false,
		is_forwarding: false,
		is_public_provider: false,
		mx_valid: false,
		domain_authority: 0,
		is_role_account: false,
	},
	forwardingService: {
		email: 'user@forward.com',
		is_disposable: false,
		is_forwarding: true,
		is_public_provider: false,
		mx_valid: true,
		domain_authority: 50,
		is_role_account: false,
	},
	roleAccount: {
		email: 'support@example.com',
		is_disposable: false,
		is_forwarding: false,
		is_public_provider: false,
		mx_valid: true,
		domain_authority: 75,
		is_role_account: true,
	},
	apiError: {
		error: 'Invalid API key',
	},
};
