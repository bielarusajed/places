import { command, run, string } from '@drizzle-team/brocli';

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

run([downloadCommand, seedCommand]);
