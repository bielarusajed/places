import { command, run, string } from '@drizzle-team/brocli';

import { createAdmin } from './create-admin';
import { download } from './download';
import { seed } from './seed';

const downloadCommand = command({
  name: 'download',
  aliases: ['dl'],
  options: {
    destination: string().default('data'),
  },
  handler: download,
});

const seedCommand = command({
  name: 'seed',
  aliases: ['s'],
  options: {
    inputTSV: string().default('data/daviednik_Lemciuhovaj.tsv'),
    inputXML: string().default('data/NP.xml'),
  },
  handler: seed,
});

const createAdminCommand = command({
  name: 'create-admin',
  aliases: ['ca'],
  options: {
    name: string().required(),
    email: string().required(),
    password: string(),
  },
  handler: createAdmin,
});

run([downloadCommand, seedCommand, createAdminCommand]);
