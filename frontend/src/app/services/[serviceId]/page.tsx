import ServiceDetailsClient from "./ServiceDetailsClient";

export default async function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const serviceId = (await params).serviceId;
  return <ServiceDetailsClient serviceId={serviceId} />;
}
