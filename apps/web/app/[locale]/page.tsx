import { getTranslations } from "next-intl/server";
import ComingSoon from "@/components/comming-soon/ComingSoon";
import {
  createBreadcrumbListJsonLd,
  createOrganizationJsonLd,
  createSoftwareAppJsonLd,
  createVideoGameJsonLd,
  JsonLd
} from "@/components/JsonLd";

export default async function HomePage() {
  const t = await getTranslations();
  return (
    <>
      <ComingSoon />
      <JsonLd jsonLd={createBreadcrumbListJsonLd(t)} />
      <JsonLd jsonLd={createVideoGameJsonLd(t)} />
      <JsonLd jsonLd={createSoftwareAppJsonLd(t)} />
      <JsonLd jsonLd={createOrganizationJsonLd(t)} />
    </>
  );
}
