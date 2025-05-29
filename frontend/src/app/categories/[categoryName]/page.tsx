import ServicesByCategoryClient from "./ServicesByCategoryClient";

export default async function ServicesByCategoryPage({
  params,
}: {
  params: Promise<{ categoryName: string }>;
}) {
  const categoryName = (await params).categoryName;
  return <ServicesByCategoryClient categoryName={categoryName} />;
}
