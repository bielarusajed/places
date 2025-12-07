import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PlaceForm } from '@/lib/types';

const caseLabels = {
  N: 'Назоўны',
  G: 'Родны',
  D: 'Давальны',
  A: 'Вінавальны',
  I: 'Творны',
  L: 'Месны',
  V: 'Клічны',
} as const;

const caseOrder = ['N', 'G', 'D', 'A', 'I', 'L', 'V'] as const;

// Parse paradigm tag to extract case and number
// 2-char tags (nouns): Case + Number (e.g. NS, GP)
// 3-char tags (substantivized adjectives): Gender + Case + Number (e.g. NNS, NGS)
function parseParadigmTag(tag: string): { case: string; number: string } | null {
  if (tag.length === 2) return { case: tag[0], number: tag[1] };
  if (tag.length === 3) return { case: tag[1], number: tag[2] };
  return null;
}

function formatFormWithStress(form: string, stressIndexes: number[] | null) {
  if (!stressIndexes || stressIndexes.length === 0) {
    return form;
  }

  let result = '';
  for (let i = 0; i < form.length; i++) {
    result += form[i];
    if (stressIndexes.includes(i)) {
      result += '\u0301'; // combining acute accent
    }
  }
  return result;
}

type ParadigmVariant = {
  id: string;
  forms: PlaceForm[];
};

function formatFormsWithStress(forms: PlaceForm[]) {
  return forms.map((f) => formatFormWithStress(f.form, f.stressIndexes)).join(', ');
}

function ParadigmTable({
  variant,
  variantIndex,
  totalVariants,
}: {
  variant: ParadigmVariant;
  variantIndex: number;
  totalVariants: number;
}) {
  // Group forms by case and number (handles both 2-char and 3-char tags)
  const formsMap = new Map<string, PlaceForm[]>();
  variant.forms.forEach((f) => {
    if (f.paradigmTag) {
      const parsed = parseParadigmTag(f.paradigmTag);
      if (parsed) {
        const key = parsed.case + parsed.number; // normalize to 2-char key
        const existing = formsMap.get(key) || [];
        existing.push(f);
        formsMap.set(key, existing);
      }
    }
  });

  const hasSingular = caseOrder.some((c) => formsMap.has(c + 'S'));
  const hasPlural = caseOrder.some((c) => formsMap.has(c + 'P'));
  const casesWithData = caseOrder.filter((c) => formsMap.has(c + 'S') || formsMap.has(c + 'P'));

  if (casesWithData.length === 0) return null;

  return (
    <Card>
      {totalVariants > 1 && (
        <CardHeader className="">
          <span className="text-muted-foreground text-xs">
            Варыянт {variantIndex + 1} з {totalVariants}
          </span>
        </CardHeader>
      )}
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Склон</TableHead>
              {hasSingular && <TableHead>Адз. лік</TableHead>}
              {hasPlural && <TableHead>Мн. лік</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {casesWithData.map((caseKey) => {
              const singularForms = formsMap.get(caseKey + 'S');
              const pluralForms = formsMap.get(caseKey + 'P');

              return (
                <TableRow key={caseKey}>
                  <TableCell className="text-muted-foreground">{caseLabels[caseKey]}</TableCell>
                  {hasSingular && <TableCell>{singularForms ? formatFormsWithStress(singularForms) : '—'}</TableCell>}
                  {hasPlural && <TableCell>{pluralForms ? formatFormsWithStress(pluralForms) : '—'}</TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

type Props = {
  paradigmForms: PlaceForm[];
  mainFormText: string;
};

function ParadigmCarousel({ paradigmForms, mainFormText }: Props) {
  // Group paradigm forms by variant
  const paradigmVariants: ParadigmVariant[] = [];
  const variantMap = new Map<string, PlaceForm[]>();
  paradigmForms.forEach((f) => {
    if (f.paradigmVariant) {
      const existing = variantMap.get(f.paradigmVariant) || [];
      existing.push(f);
      variantMap.set(f.paradigmVariant, existing);
    }
  });
  variantMap.forEach((forms, id) => {
    paradigmVariants.push({ id, forms });
  });

  if (paradigmVariants.length === 0) return null;

  // Sort variants: prioritize those where nominative matches main form
  const sortedVariants = [...paradigmVariants].sort((a, b) => {
    // Find nominative form (case N) for any number
    const aNominative = a.forms.find((f) => {
      if (!f.paradigmTag) return false;
      const parsed = parseParadigmTag(f.paradigmTag);
      return parsed?.case === 'N';
    });
    const bNominative = b.forms.find((f) => {
      if (!f.paradigmTag) return false;
      const parsed = parseParadigmTag(f.paradigmTag);
      return parsed?.case === 'N';
    });

    const aMatches = aNominative?.form === mainFormText ? 1 : 0;
    const bMatches = bNominative?.form === mainFormText ? 1 : 0;

    return bMatches - aMatches;
  });

  if (paradigmVariants.length === 1) {
    return (
      <div className="p-1">
        <ParadigmTable variant={sortedVariants[0]} variantIndex={0} totalVariants={1} />
      </div>
    );
  }

  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent className="-ml-2 p-1 md:-ml-4">
        {sortedVariants.map((variant, idx) => (
          <CarouselItem key={variant.id} className="pl-2 md:pl-4">
            <ParadigmTable variant={variant} variantIndex={idx} totalVariants={sortedVariants.length} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

export default ParadigmCarousel;
