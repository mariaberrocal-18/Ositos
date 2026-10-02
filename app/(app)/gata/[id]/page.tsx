import { notFound } from "next/navigation";
import { PetView } from "@/components/views";
import { isPetId } from "@/lib/config";

export function generateStaticParams() {
  return [{ id: "amelia" }, { id: "simona" }];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isPetId(id)) notFound();
  return <PetView key={id} id={id} />;
}
