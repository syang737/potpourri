import { GamePage } from "@/components/GamePage";

export default async function VerticalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <GamePage verticalSlug={slug} />;
}
