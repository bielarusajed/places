export type LocalityType =
  | 'agrotown'
  | 'village'
  | 'city'
  | 'urban_settlement'
  | 'resort_settlement'
  | 'townlet'
  | 'settlement'
  | 'worker_settlement'
  | 'siding'
  | 'selo'
  | 'station'
  | 'farmstead';

export type FormType = 'main' | 'alias' | 'alias-ru' | 'transliteration' | 'russian' | 'paradigm';

export type SearchResult = {
  id: number;
  name: string;
  type: LocalityType;
  region: string;
  district: string | null;
  council: string | null;
  transliteration: string | null;
  russian: string | null;
};

export type PlaceForm = {
  id: number;
  type: FormType;
  form: string;
  gender: 'm' | 'f' | 'n' | 'p' | null;
  stressIndexes: number[] | null;
};

export type PlaceDetails = {
  id: number;
  name: string;
  type: LocalityType;
  region: string;
  district: string | null;
  council: string | null;
  forms: PlaceForm[];
};

export const localityTypeLabels: Record<LocalityType, string> = {
  agrotown: 'Аграгарадок',
  village: 'Вёска',
  city: 'Горад',
  urban_settlement: 'Гарадскі пасёлак',
  resort_settlement: 'Курортны пасёлак',
  townlet: 'Мястэчка',
  settlement: 'Пасёлак',
  worker_settlement: 'Рабочы пасёлак',
  siding: 'Раз’езд',
  selo: 'Сяло',
  station: 'Станцыя',
  farmstead: 'Хутар',
};
