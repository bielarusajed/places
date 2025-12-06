import fsSync from 'node:fs';
import fs from 'node:fs/promises';

import { parse } from '@fast-csv/parse';
import { createId } from '@paralleldrive/cuid2';
import { XMLParser } from 'fast-xml-parser';

import db, { forms, places } from '../src/db';

type Options = {
  inputTSV: string;
  inputXML: string;
};

const typeMap = {
  'аг.': 'agrotown',
  'в.': 'village',
  'г.': 'city',
  'г. п.': 'urban_settlement',
  'г.п.': 'urban_settlement',
  'к. п.': 'resort_settlement',
  'к.п.': 'resort_settlement',
  'мяст.': 'townlet',
  'п.': 'settlement',
  'р. п.': 'worker_settlement',
  'р.п.': 'worker_settlement',
  'раз’езд': 'siding',
  рзд: 'siding',
  'с.': 'selo',
  'ст.': 'station',
  'х.': 'farmstead',
} as const;

const genderMap = {
  ж: 'f',
  'ж.': 'f',
  м: 'm',
  'м.': 'm',
  мн: 'n',
  'мн.': 'p',
  'н.': 'n',
} as const;

type TSVRow = {
  Вобласць: string;
  Раён: string;
  Сельсавет: string;
  Тып: keyof typeof typeMap;
  Назва: string;
  'Назва без націскаў': string;
  Род: keyof typeof genderMap;
  Парадыгма: string;
  Транслітарацыя: string;
  'Назва па-расейску': string;
  'Варыянты назвы': string;
  'Назвы што ўжываюцца да цяперашняга часу(рас)': string;
  'OpenStreetMap каардынаты': string;
  'OpenStreetMap ID': string;
  'OpenStreetMap URL': string;
};

type Form = {
  '#text': string;
  '@_tag': string;
  '@_slouniki'?: string;
};

type Variant = {
  Form: Form | Form[];
  '@_id': string;
  '@_lemma': string;
  '@_slouniki'?: string;
  '@_pravapis'?: string;
};

type Paradigm = {
  Variant: Variant | Variant[];
  '@_pdgId': string;
  '@_lemma': string;
  '@_tag': string;
};

type GrammarDB = {
  Wordlist: {
    Paradigm: Paradigm[];
  };
};

function parseDmsCoordinates(input: string) {
  // Падтрымлівае і ' і ′, і " і ″, і магчымыя прабелы пасля сімвалаў
  const regex =
    /(?<lat>\d+)°\s*(?<latm>\d+)['′]\s*(?<lats>\d+(?:\.\d+)?)["″]\s+(?<lon>\d+)°\s*(?<lonm>\d+)['′]\s*(?<lons>\d+(?:\.\d+)?)["″]/;

  const match = input.match(regex);

  if (!match) return null;

  // if (!match) throw new Error('Invalid coordinate format');

  // Парсім радок у лікі (parseFloat/parseInt)
  // Групы пачынаюцца з індэкса 1 (0 - гэта ўвесь радок)
  const latParts = {
    d: parseInt(match.groups?.lat ?? '', 10),
    m: parseInt(match.groups?.latm ?? '', 10),
    s: parseFloat(match.groups?.lats ?? ''),
  };

  const lonParts = {
    d: parseInt(match.groups?.lon ?? '', 10),
    m: parseInt(match.groups?.lonm ?? '', 10),
    s: parseFloat(match.groups?.lons ?? ''),
  };

  // Канвертуем у Decimal Degrees
  const latDecimal = latParts.d + latParts.m / 60 + latParts.s / 3600;
  const lonDecimal = lonParts.d + lonParts.m / 60 + lonParts.s / 3600;

  return {
    lat: latDecimal,
    lng: lonDecimal,
  };
}

export const seed = async (options: Options) => {
  const { inputTSV, inputXML } = options;

  const xmlContent = await fs.readFile(inputXML);
  const parser = new XMLParser({ ignoreAttributes: false });
  const grammarDB = parser.parse(xmlContent) as GrammarDB;
  // console.log(grammarDB.Wordlist.Paradigm.find((p) => p['@_pdgId'] === '1037675')!.Variant);
  // process.exit(0);

  try {
    process.stdout.write(`Seeding places from ${inputTSV}...\n`);
    const tsvStream = fsSync.createReadStream(inputTSV, 'utf-8');
    const tsvParsedStream = tsvStream.pipe(parse({ delimiter: '\t', quote: null, headers: true }));
    tsvParsedStream.on('error', (error) => process.stderr.write(`Error parsing TSV: ${error.stack}\n`));
    tsvParsedStream.on('data', async (row: TSVRow) => {
      const stressIndexes = new Set<number>();
      for (let i = 0; i < row['Назва'].length; i++)
        if (row['Назва'][i] === String.fromCharCode(769)) stressIndexes.add(i - 1);

      const sameParadigms = grammarDB.Wordlist.Paradigm.filter(
        (p) => p['@_lemma'].split('+').join('') === row['Назва без націскаў'],
      );

      const sameStressParadigms = sameParadigms.filter((p) => {
        const paradigmStressIndexes = new Set<number>();
        for (let i = 0; i < p['@_lemma'].length; i++) if (p['@_lemma'][i] === '+') paradigmStressIndexes.add(i - 1);

        return (
          stressIndexes.difference(paradigmStressIndexes).size === 0 &&
          paradigmStressIndexes.difference(stressIndexes).size === 0
        );
      });

      const [place] = await db
        .insert(places)
        .values({
          region: row['Вобласць'],
          district: row['Раён'] !== '<Вобласць>' ? row['Раён'] : null,
          council: !['<Вобласць>', '<Раён>'].includes(row['Сельсавет']) ? row['Сельсавет'] : null,
          type: typeMap[row['Тып']],
          name: row['Назва'],
          coordinates: parseDmsCoordinates(row['OpenStreetMap каардынаты']),
          osmId: row['OpenStreetMap ID'] || null,
        })
        .returning();
      if (!place) throw new Error(`Failed to seed place: ${row['Назва']}`);

      const variants = sameStressParadigms
        .map((p) => p.Variant)
        .flat()
        .map((v) => ({ ...v, '@_id': createId() }));

      const formsFromVariants = variants
        .map((v) =>
          (Array.isArray(v.Form) ? v.Form : [v.Form]).map((form) => {
            const formStressIndexes = new Set<number>();
            for (let i = 0; i < form['#text'].length; i++) if (form['#text'][i] === '+') formStressIndexes.add(i - 1);
            return {
              placeId: place.id,
              type: 'paradigm' as const,
              paradigmVariant: v['@_id'],
              paradigmTag: form['@_tag'],
              stressIndexes: Array.from(formStressIndexes),
              form: form['#text'],
            };
          }),
        )
        .flat();

      await db.insert(forms).values([
        {
          placeId: place.id,
          type: 'main',
          gender: genderMap[row['Род']],
          form: row['Назва без націскаў'],
          stressIndexes: Array.from(stressIndexes),
        },
        {
          placeId: place.id,
          type: 'transliteration',
          gender: genderMap[row['Род']],
          form: row['Транслітарацыя'],
        },
        {
          placeId: place.id,
          type: 'russian',
          gender: genderMap[row['Род']],
          form: row['Назва па-расейску'],
        },
        ...row['Варыянты назвы'].split(';').map((variant) => ({
          placeId: place.id,
          type: 'alias' as const,
          gender: genderMap[variant.split(',')[1]?.trim() as keyof typeof genderMap] || genderMap[row['Род']],
          form: variant.split(',')[0].trim(),
        })),
        {
          placeId: place.id,
          type: 'russian',
          gender: genderMap[row['Род']],
          form: row['Назвы што ўжываюцца да цяперашняга часу(рас)'],
        },
        ...formsFromVariants,
      ]);
    });
    await new Promise((resolve) => tsvParsedStream.on('end', resolve));
    tsvParsedStream.on('end', (rowCount: number) => process.stdout.write(`Parsed ${rowCount} places.\n`));
  } catch (error) {
    if (error instanceof Error) process.stderr.write(`Error seeding places: ${error.stack}\n`);
    else process.stderr.write(`Error seeding places: unknown error\n`);
    process.exit(1);
  }
};
