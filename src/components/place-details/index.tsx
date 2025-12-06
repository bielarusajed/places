import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { localityTypeLabels, type PlaceDetails as PlaceDetailsType } from '@/lib/types';

type Props = {
  place: PlaceDetailsType;
};

const genderLabels = {
  m: 'мужчынскі род',
  f: 'жаночы род',
  n: 'ніякі род',
  p: 'множны лік',
} as const;

const genderShort = {
  m: 'м.',
  f: 'ж.',
  n: 'н.',
  p: 'мн.',
} as const;

function LocationPath({ place }: { place: PlaceDetailsType }) {
  const parts = [
    `${place.region} вобласць`,
    place.district ? `${place.district} раён` : null,
    place.council ? `${place.council} сельсавет` : null,
  ].filter(Boolean);

  return <p className="text-muted-foreground text-sm">{parts.join(' • ')}</p>;
}

function DataItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

type PlaceForm = PlaceDetailsType['forms'][number];

function AliasChip({ alias }: { alias: PlaceForm }) {
  const isRussian = alias.type === 'alias-ru';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        isRussian
          ? 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50'
          : 'bg-card hover:bg-accent shadow-sm'
      }`}
    >
      <span>{alias.form}</span>
      {alias.gender && <span className="text-muted-foreground text-xs">({genderShort[alias.gender]})</span>}
      {isRussian && <span className="text-[10px] opacity-50">рус.</span>}
    </span>
  );
}

function PlaceDetails({ place }: Props) {
  const mainForm = place.forms.find((f) => f.type === 'main');
  const aliasNames = place.forms.filter((f) => f.type === 'alias' || f.type === 'alias-ru');
  const transliteration = place.forms.find((f) => f.type === 'transliteration');
  const russian = place.forms.find((f) => f.type === 'russian');

  const hasTranslations = transliteration || russian;
  const hasAliases = aliasNames.length > 0;
  const hasGrammar = mainForm?.gender;

  return (
    <div className="px-4 py-10">
      <article className="mx-auto max-w-lg">
        {/* Header */}
        <header className="mb-10 text-center">
          <Badge variant="secondary" className="mb-4 text-xs tracking-wider uppercase">
            {localityTypeLabels[place.type]}
          </Badge>
          <h1 className="mb-3 text-5xl font-bold tracking-tight">{place.name}</h1>
          <LocationPath place={place} />
        </header>

        <Separator className="my-8" />

        {/* Content sections */}
        <div className="space-y-8">
          {/* Translations */}
          {hasTranslations && (
            <section>
              <h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">Назвы</h2>
              <div className="divide-border divide-y">
                {transliteration && <DataItem label="Лацінкай">{transliteration.form}</DataItem>}
                {russian && <DataItem label="Па-руску">{russian.form}</DataItem>}
              </div>
            </section>
          )}

          {/* Alternative names */}
          {hasAliases && (
            <section>
              <h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
                Іншыя назвы
              </h2>
              <div className="flex flex-wrap gap-2">
                {aliasNames.map((alias) => (
                  <AliasChip key={alias.id} alias={alias} />
                ))}
              </div>
            </section>
          )}

          {/* Grammar */}
          {hasGrammar && (
            <section>
              <h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">Граматыка</h2>
              <div className="divide-border divide-y">
                {mainForm!.gender && <DataItem label="Род">{genderLabels[mainForm!.gender]}</DataItem>}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}

export default PlaceDetails;
