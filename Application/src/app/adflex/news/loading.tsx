import { adflexContent } from "@/projects/adflex/content";
import { RouteLoading } from "@/components/adflex/RouteLoading";

export default function NewsLoading() {
  return (
    <RouteLoading
      eyebrow={adflexContent.news.eyebrow}
      title={adflexContent.news.title}
    />
  );
}
