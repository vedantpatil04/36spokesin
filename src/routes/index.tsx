import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, TriangleAlert } from "lucide-react";
import {
  Badge,
  Button,
  ButtonLink,
  Media,
  Rail,
  RailItem,
  Section,
  SectionHeader,
} from "@/components/ui-kit";
import { BikeCard, DestinationCard, ProductCard, RideCard, RiderCard, StoryCard, TripCard } from "@/components/cards";
import {
  bikes,
  destinations,
  garageServices,
  media,
  products,
  rides,
  riders,
  setupChecklist,
  shopCategories,
  stories,
  trips,
} from "@/data/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "36 Spokes | Motorcycle Travel, Gear & Rider Community" },
      {
        name: "description",
        content:
          "Plan Himalayan expeditions, find gear that fits your motorcycle, discover weekend rides and ride with a real rider community.",
      },
      { property: "og:title", content: "36 Spokes | Motorcycle Travel, Gear & Rider Community" },
      {
        property: "og:description",
        content: "Expeditions, gear matched to your bike, rides and rider community.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [selectedBike, setSelectedBike] = useState(bikes[0]!);

  return (
    <>
      {/* 1. HERO */}
      <section className="relative">
        <Media
          src={media.heroRide}
          alt="Rider on a loaded adventure motorcycle climbing a Himalayan mountain road at sunrise"
          ratio="auto"
          className="h-[78svh] min-h-125 w-full lg:h-[88svh]"
          priority
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/25" />
        </Media>
        <div className="absolute inset-0 flex items-end">
          <div className="container-page pb-14 md:pb-20">
            <div className="max-w-3xl rise">
              <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-background/70 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
                <img
                  src={media.brandLogo}
                  alt="36 Spokes Official Crest"
                  className="size-5 rounded-full object-cover ring-1 ring-primary/40"
                />
                <span className="font-display text-xs uppercase tracking-[0.2em] text-foreground/90">
                  Official 36 Spokes Rider Network
                </span>
              </div>
              <p className="eyebrow">Motorcycle travel · Gear · Community</p>
              <h1 className="mt-4 text-4xl leading-[0.98] sm:text-6xl lg:text-7xl">
                The road starts where the map runs out
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Expeditions across the Himalaya, gear matched to the motorcycle in your garage, and riders who turn up
                when you post a route.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink to="/travel" size="lg">
                  Explore travel <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
                <ButtonLink to="/shop" variant="outline" size="lg">
                  Shop your bike
                </ButtonLink>
                <ButtonLink to="/rides" variant="ghost" size="lg">
                  Plan a ride
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CHOOSE YOUR BIKE */}
      <Section id="choose-your-bike">
        <SectionHeader
          eyebrow="Start with your bike"
          title="Everything here begins with what you ride"
          description="Pick your motorcycle once. Gear, fitment, services and trip preparation adjust around it."
          action={
            <ButtonLink to="/garage" variant="outline">
              Open garage
            </ButtonLink>
          }
        />
        <Rail className="mt-10 md:grid-cols-3 lg:grid-cols-6">
          {bikes.map((bike) => (
            <RailItem key={bike.id}>
              <BikeCard bike={bike} selected={bike.id === selectedBike.id} onSelect={setSelectedBike} />
            </RailItem>
          ))}
        </Rail>
        <div className="mt-8 flex flex-col gap-4 rounded-sm border border-border bg-surface p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">Selected motorcycle</p>
            <p className="mt-2 font-display text-xl uppercase">
              {selectedBike.brand} {selectedBike.model}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Compatible products, recommended gear and workshop services are filtered to this model.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">✓ Compatible products</Badge>
            <Badge tone="primary">Recommended gear</Badge>
            <Badge>Services</Badge>
          </div>
        </div>
      </Section>

      {/* 3. TRAVEL */}
      <Section tone="surface">
        <SectionHeader
          eyebrow="Travel"
          title="Where will you ride next?"
          description="Routes chosen for the riding, not the sightseeing. Small groups, support vehicle, and days built around daylight."
          action={
            <ButtonLink to="/travel" variant="outline">
              Explore all travel
            </ButtonLink>
          }
        />
        <Rail className="mt-10 md:grid-cols-3">
          {destinations.slice(0, 6).map((destination) => (
            <RailItem key={destination.slug}>
              <DestinationCard destination={destination} />
            </RailItem>
          ))}
        </Rail>
      </Section>

      {/* 4. UPCOMING EXPEDITIONS */}
      <Section>
        <SectionHeader
          eyebrow="Upcoming departures"
          title="Ride with us"
          description="Fixed departures with confirmed dates, distances and seat counts."
          action={
            <ButtonLink to="/travel" variant="outline">
              All departures
            </ButtonLink>
          }
        />
        <Rail className="mt-10 md:grid-cols-2 lg:grid-cols-4">
          {trips.map((trip) => (
            <RailItem key={trip.id}>
              <TripCard trip={trip} />
            </RailItem>
          ))}
        </Rail>
      </Section>

      {/* 5. GEAR UP */}
      <Section tone="surface">
        <SectionHeader
          eyebrow="Shop"
          title="Gear up for the road"
          description="Categories built around what the gear does on a ride, not around brand names."
          action={
            <ButtonLink to="/shop" variant="outline">
              Browse the shop
            </ButtonLink>
          }
        />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {shopCategories.map((category) => (
            <li key={category.slug}>
              <Link
                to="/shop"
                className="group flex h-full flex-col justify-between rounded-sm border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <span className="font-display text-base uppercase tracking-[0.12em]">{category.name}</span>
                <span className="mt-6 text-xs text-muted-foreground">{category.purpose}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <article className="relative overflow-hidden rounded-sm border border-border">
            <Media
              src={media.productLuggage}
              alt="Adventure motorcycle fitted with aluminium panniers and crash protection"
              ratio="16/10"
              className="h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex max-w-sm flex-col justify-center p-6 md:p-10">
                <p className="eyebrow">Installed, not just shipped</p>
                <h3 className="mt-3 text-2xl md:text-3xl">Built for a loaded bike</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  Luggage, guards and lighting shown fitted to real motorcycles, with fitment listed per variant.
                </p>
                <ButtonLink to="/shop" variant="outline" className="mt-6 self-start">
                  See carry systems
                </ButtonLink>
              </div>
            </Media>
          </article>
          <div className="grid grid-cols-2 gap-4">
            {products.slice(0, 2).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        <Rail className="mt-4 md:grid-cols-4">
          {products.slice(2, 6).map((product) => (
            <RailItem key={product.id}>
              <ProductCard product={product} />
            </RailItem>
          ))}
        </Rail>
      </Section>

      {/* 6. SIGNATURE: PREPARE */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="Signature"
              title="Prepare for your next adventure"
              description="Tell us the destination and the motorcycle. We show what your setup is missing before you leave."
            />
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-sm border border-border bg-card p-4">
                <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">Where are you going?</dt>
                <dd className="mt-2 font-display text-xl uppercase">Spiti</dd>
              </div>
              <div className="rounded-sm border border-border bg-card p-4">
                <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">What are you riding?</dt>
                <dd className="mt-2 font-display text-xl uppercase">
                  {selectedBike.model}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-sm border border-border bg-surface p-6 md:p-8">
            <h3 className="text-xl">Your ride setup</h3>
            <ul className="mt-6 divide-y divide-border">
              {setupChecklist.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-4 py-3.5">
                  <div>
                    <p className="font-display text-sm uppercase tracking-[0.14em]">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.note}</p>
                  </div>
                  {item.status === "ready" ? (
                    <span className="flex items-center gap-1.5 text-xs text-success">
                      <Check className="size-4" aria-hidden /> Ready
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-warning">
                      <TriangleAlert className="size-4" aria-hidden /> Missing
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <Button className="mt-7 w-full" size="lg">
              Build my setup
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Placeholder preview — recommendations will be generated from your garage.
            </p>
          </div>
        </div>
      </Section>

      {/* 7. RIDES */}
      <Section tone="surface">
        <SectionHeader
          eyebrow="Rides"
          title="Find your next ride"
          description="Weekend runs, day loops, group rides and meets posted by riders near you."
          action={
            <ButtonLink to="/rides" variant="outline">
              Plan a ride
            </ButtonLink>
          }
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      </Section>

      {/* 8. COMMUNITY */}
      <Section>
        <SectionHeader
          eyebrow="Community"
          title="The 36 Spokes rider community"
          description="Riders, groups and stories from people who actually put the kilometres in."
          action={
            <ButtonLink to="/community" variant="outline">
              Meet the riders
            </ButtonLink>
          }
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Media
            src={media.communityRiders}
            alt="Group of riders and their motorcycles at a mountain viewpoint"
            ratio="16/10"
            className="rounded-sm border border-border"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {riders.map((rider) => (
              <RiderCard key={rider.id} rider={rider} />
            ))}
          </div>
        </div>
        <Rail className="mt-4 md:grid-cols-3">
          {stories.map((story) => (
            <RailItem key={story.slug}>
              <StoryCard story={story} />
            </RailItem>
          ))}
        </Rail>
      </Section>

      {/* 9. GARAGE */}
      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Media
            src={media.garageWorkshop}
            alt="Mechanic fitting accessories to an adventure motorcycle in a workshop"
            ratio="3/2"
            className="rounded-sm border border-border"
          />
          <div>
            <SectionHeader eyebrow="Garage" title="Your bike. Your setup. Your garage." />
            <ul className="mt-8 divide-y divide-border border-y border-border">
              {garageServices.map((service) => (
                <li key={service.name} className="py-4">
                  <p className="font-display text-sm uppercase tracking-[0.16em]">{service.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{service.note}</p>
                </li>
              ))}
            </ul>
            <ButtonLink to="/garage" className="mt-8">
              Enter the garage
            </ButtonLink>
          </div>
        </div>
      </Section>

      {/* 10. FINAL CTA */}
      <Section>
        <div className="rounded-sm border border-border bg-card px-6 py-14 text-center md:px-16 md:py-20">
          <p className="eyebrow">Join 36 Spokes</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl leading-tight sm:text-4xl lg:text-5xl">
            Keep your bike, your gear and your next ride in one place
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
            Create a rider profile, add your motorcycle, and everything on 36 Spokes starts speaking your bike's
            language.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/join" size="lg">
              Create your rider profile
            </ButtonLink>
            <ButtonLink to="/travel" variant="outline" size="lg">
              Browse expeditions
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
