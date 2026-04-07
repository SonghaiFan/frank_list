import { Card } from "@/components/ui/Card";
import { NotebookHeader } from "@/components/ui/NotebookHeader";
import { getGroupPageStatus } from "@/lib/page-status";
import type { GroupPage } from "@/lib/notebook-types";

interface GalleryNotebookCardProps {
  onOpen: () => void;
  statusLabel: string;
  title: string;
  totalPagesLabel: string;
  pages: GroupPage[];
}

export function GalleryNotebookCard({
  onOpen,
  pages,
  statusLabel,
  title,
  totalPagesLabel,
}: GalleryNotebookCardProps) {
  return (
    <button
      type="button"
      className="w-full max-w-90 cursor-pointer text-left transition-transform hover:-translate-y-px"
      onClick={onOpen}
      title={title}
    >
      <Card variant="paper" className="w-full">
        <div className="paper-content px-4! py-0!">
          <NotebookHeader
            inset="mobile"
            title={title}
            subtitle={totalPagesLabel}
            status={getGroupPageStatus(pages)}
            statusLabel={statusLabel}
          />
        </div>
      </Card>
    </button>
  );
}
