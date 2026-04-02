/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SupportUserCheckApi1775160220000 {
    name = 'SupportUserCheckApi1775160220000'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "usercheckApiKey" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableUsercheckApi" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableUsercheckApi"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "usercheckApiKey"`);
    }
}
