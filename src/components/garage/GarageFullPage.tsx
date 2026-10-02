import { BikeCard } from "@/components/cards";
import { AddToGarageButton } from "@/components/garage/AddToGarageButton";
import { RecommendedForBike } from "@/components/garage/RecommendedForBike";
import { SetupChecklist } from "@/components/garage/SetupChecklist";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states";
import {
  ActionGroup,
  ButtonLink,
  Media,
  Rail,
  RailItem,
  Section,
  SectionHeader,
} from "@/components/ui-kit";
import { media } from "@/data/media";
import { useSelectBike, useSelectedBikeId } from "@/state/garage";
import type { Bike, GarageService, SetupChecklistItem } from "@/types";

interface GarageFullPageProps {
  bikes: Bike[];
  services: GarageService[];
  checklist: SetupChecklistItem[];
}

/**
 * Full public Garage page implementation. Preserved here so it can be restored
 * instantly when Coming Soon mode is removed.
 */
export function GarageFullPage({ bikes, services, checklist }: GarageFullPageProps) {
  const selectedBikeId = useSelectedBikeId();
  const selectBike = useSelectBike();
  const selected = bikes.find((bike) => bike.id === selectedBikeId) ?? null;

  const header = (
    <PageHeader
      eyebrow="Garage"
      title="Your bike. Your setup. Your garage."
      description="Start with your motorcycle and everything else — parts, fitment, servicing, trip prep — lines up behind it."
      image={media.garage.workshop}
      imageAlt="Motorcycle workshop with a mechanic working on an adventure bike"
    />
  );

  if (bikes.length === 0) {
    return (
      <>
        {header}
        <Section>
          <EmptyState
            title="No motorcycles listed yet"
            description="The bike catalogue is being prepared. Gear in the shop is still available."
            action={
              <ButtonLink to="/shop" variant="outline">
                Browse gear
              </ButtonLink>
            }
          />
        </Section>
      </>
    );
  }

  return (
    <>
      {header}

      <Section>
        <SectionHeader eyebrow="Find your bike" title="Brand · Model · Variant" />
        <Rail className="mt-10 md:grid-cols-3 lg:grid-cols-6">
          {bikes.map((bike) => (
            <RailItem key={bike.id}>
              <BikeCard
                bike={bike}
                selected={bike.id === selected?.id}
                onSelect={(chosen) => selectBike(chosen.id)}
              />
            </RailItem>
          ))}
        </Rail>
      </Section>

      <Section tone="surface">
        {selected ? (
          <>
            <SectionHeader
              eyebrow={`${selected.brand} ${selected.model}`}
              title="Recommended for this motorcycle"
              action={
                <ActionGroup>
                  <ButtonLink to="/garage/$bike" params={{ bike: selected.slug }} variant="outline">
                    Bike details
                  </ButtonLink>
                  <AddToGarageButton bike={selected} size="sm" />
                  <ButtonLink to="/shop" variant="outline">
                    See all gear
                  </ButtonLink>
                </ActionGroup>
              }
            />
            <RecommendedForBike bikeId={selected.id} className="mt-10" />
          </>
        ) : (
          <EmptyState
            title="Choose your motorcycle"
            description="Pick your bike above to see gear confirmed to fit it. Sign in and it's saved to your garage."
          />
        )}
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader eyebrow="Services" title="Work done properly" />
            <ul className="mt-8 divide-y divide-border border-y border-border">
              {services.map((service) => (
                <li key={service.name} className="py-4">
                  <p className="font-display text-sm uppercase tracking-[0.16em]">{service.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{service.note}</p>
                </li>
              ))}
            </ul>
          </div>
          <Media
            asset={media.garage.workshop}
            alt="Accessories being fitted to a motorcycle in a workshop"
            ratio="3/2"
            className="rounded-sm border border-border"
          />
        </div>
      </Section>

      <Section id="trip-ready" tone="surface">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="Trip-ready check"
              title="Prepare for your next adventure"
              description="Tell us the destination and the motorcycle. We show what your setup is missing before you leave."
            />
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-sm border border-border bg-card p-4">
                <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Where are you going?
                </dt>
                <dd className="mt-2 font-display text-xl uppercase">Spiti</dd>
              </div>
              <div className="rounded-sm border border-border bg-card p-4">
                <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                  What are you riding?
                </dt>
                <dd className="mt-2 font-display text-xl uppercase">
                  {selected?.model ?? "Choose above"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-sm border border-border bg-card p-6 md:p-8">
            <h3 className="text-xl">Your ride setup</h3>
            <SetupChecklist items={checklist} />
            <ButtonLink to="/shop" className="mt-7 w-full" size="lg">
              Shop missing gear
            </ButtonLink>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Placeholder preview. Recommendations will be generated from your garage.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
