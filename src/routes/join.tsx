import { Link, createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button, FormField, SelectInput, TextInput } from "@/components/ui-kit";
import { media } from "@/data/media";
import { seo } from "@/lib/seo";
import { listBikes } from "@/services/catalog";

export const Route = createFileRoute("/join")({
  loader: async () => ({ bikes: await listBikes() }),
  head: () =>
    seo({
      title: "Join 36 Spokes | Create Your Rider Profile",
      description:
        "Create a 36 Spokes rider profile, add your motorcycle and get gear, rides and trips matched to it.",
      socialDescription: "Add your motorcycle and make the whole platform fit your bike.",
      path: "/join",
    }),
  component: JoinPage,
});

function JoinPage() {
  const { bikes } = Route.useLoaderData();

  return (
    <AuthLayout
      image={media.site.heroRide}
      imageAlt="Rider on a mountain road at sunrise"
      imageSide="left"
      portalLabel="Rider Membership"
      eyebrow="Join 36 Spokes"
      title="Create your rider profile"
      note="Sign-up is not connected to an account system yet."
      footer={
        <>
          Already a member?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {/* Phase 3 wires this form to Supabase Auth and the rider garage. */}
      <form className="mt-8 space-y-4" onSubmit={(event) => event.preventDefault()}>
        <FormField id="name" label="Name">
          <TextInput id="name" name="name" autoComplete="name" placeholder="Your name" required />
        </FormField>
        <FormField id="join-email" label="Email">
          <TextInput
            id="join-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </FormField>
        <FormField id="bike" label="Your motorcycle">
          <SelectInput id="bike" name="bikeId">
            {bikes.map((bike) => (
              <option key={bike.id} value={bike.id}>
                {bike.brand} {bike.model}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <Button type="submit" size="lg" className="w-full">
          Create profile
        </Button>
      </form>
    </AuthLayout>
  );
}
