import { adflexContent } from "@/projects/adflex/content";
import { RouteLoading } from "@/components/adflex/RouteLoading";

export default function OutcomesLoading() {
  return (
    <RouteLoading eyebrow="Findings and papers" title={adflexContent.outcomes.title} />
  );
}
