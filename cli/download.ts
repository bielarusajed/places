import fs from 'node:fs/promises';
import path from 'node:path';

import { unzipSync } from 'fflate';
import { z } from 'zod';
// https://files.knihi.com/Knihi/Slounik/daviednik_Lemciuhovaj.zip
// https://api.github.com/repos/Belarus/GrammarDB/releases/latest

const githubResponseSchema = z.object({
  assets: z.array(
    z.object({
      content_type: z.string(),
      browser_download_url: z.string(),
    }),
  ),
  zipball_url: z.string(),
});

type Options = {
  destination: string;
};

export const download = async (options: Options) => {
  const { destination } = options;

  const outputDir = path.resolve(destination);
  await fs.mkdir(outputDir, { recursive: true });

  try {
    process.stdout.write('Downloading GrammarDB...\n');
    const apiResponse = await fetch('https://api.github.com/repos/Belarus/GrammarDB/releases/latest');
    const data = await apiResponse.json();
    const parsedData = githubResponseSchema.parse(data);
    const asset = parsedData.assets.find((asset) => asset.content_type === 'application/zip');
    const zipballUrl = asset?.browser_download_url ?? parsedData.zipball_url;
    process.stdout.write(`Found zipball URL: ${zipballUrl}. Downloading...\n`);

    const zipResponse = await fetch(zipballUrl);
    const zipBuffer = await zipResponse.arrayBuffer();
    process.stdout.write('Extracting NP.xml...\n');
    const entry = unzipSync(new Uint8Array(zipBuffer))['NP.xml'];
    if (!entry) throw new Error('NP.xml not found in ZIP');
    await fs.writeFile(path.join(outputDir, 'NP.xml'), entry);
    process.stdout.write('Done with GrammarDB!\n');
  } catch (error) {
    if (error instanceof Error) {
      process.stderr.write(`Failed to download GrammarDB: \n`);
      process.stderr.write(error.stack ?? '\n');
    } else {
      process.stderr.write(`Failed to download GrammarDB: unknown error\n`);
    }
  }

  try {
    process.stdout.write('Downloading daviednik_Lemciuhovaj.zip...\n');
    const response = await fetch('https://files.knihi.com/Knihi/Slounik/daviednik_Lemciuhovaj.zip');
    const zipBuffer = await response.arrayBuffer();
    process.stdout.write('Extracting daviednik_Lemciuhovaj.zip...\n');
    const entries = unzipSync(new Uint8Array(zipBuffer));
    const entryKey =
      Object.keys(entries).find((key) => key.toLowerCase().endsWith('.tsv')) ?? 'daviednik_Lemciuhovaj.tsv';
    await fs.writeFile(path.join(outputDir, entryKey), entries[entryKey]);
    process.stdout.write('Done with daviednik_Lemciuhovaj.tsv!\n');
  } catch (error) {
    if (error instanceof Error) {
      process.stderr.write(`Failed to download daviednik_Lemciuhovaj.tsv: \n`);
      process.stderr.write(error.stack ?? '\n');
    } else {
      process.stderr.write(`Failed to download daviednik_Lemciuhovaj.tsv: unknown error\n`);
    }
  }

  process.stdout.write('Done!\n');
};
