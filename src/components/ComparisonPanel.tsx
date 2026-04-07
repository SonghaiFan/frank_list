import { motion } from "motion/react";
import type { Group, ListItem } from "@/lib/notebook-types";
import { cn } from "@/lib/cn";
import { useI18n } from "@/hooks/useI18n";
import { layoutSpring } from "@/lib/motion";

const resultToneClassMap = {
  brand: "bg-brand",
  muted: "bg-neutral-400",
  strong: "bg-neutral-800",
  subtle: "bg-neutral-200",
} as const;

type ResultTone = keyof typeof resultToneClassMap;

interface ComparisonPanelProps {
  comparison: {
    bothDone: ListItem[];
    bothNotDone: ListItem[];
    heDoneINot: ListItem[];
    iDoneHeNot: ListItem[];
  };
  group: Group;
}

export function ComparisonPanel({ comparison, group }: ComparisonPanelProps) {
  const { t } = useI18n();

  return (
    <motion.div
      layout="position"
      transition={{ layout: layoutSpring }}
      className="hybrid-paper"
    >
      <div className="paper-lines">
        <div className="paper-content pt-3">
          <div className="on-lines mb-4 border-b border-neutral-100">
            <div className="ui-label text-klein">{t("comparison.title")}</div>
            <div className="list-text">{group.title}</div>
          </div>
          <ResultSection
            title={t("comparison.bothDone")}
            items={comparison.bothDone}
            tone="brand"
          />
          <ResultSection
            title={t("comparison.iDoneHeNot")}
            items={comparison.iDoneHeNot}
            tone="strong"
          />
          <ResultSection
            title={t("comparison.heDoneINot")}
            items={comparison.heDoneINot}
            tone="muted"
          />
          <ResultSection
            title={t("comparison.bothNotDone")}
            items={comparison.bothNotDone}
            tone="subtle"
          />
        </div>
      </div>
    </motion.div>
  );
}

function ResultSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: ListItem[];
  tone: ResultTone;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="on-lines flex items-center gap-3 border-b border-neutral-100">
        <div
          className={cn("h-4 w-1.5 rounded-full", resultToneClassMap[tone])}
        />
        <span className="ui-label text-neutral-400">{title}</span>
        <span className="ui-mono ml-auto">[{items.length}]</span>
      </h3>
      <ul className="space-y-0">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="h-1 w-1 shrink-0 rounded-full bg-neutral-200" />
            <span className="list-text on-lines flex-1 text-neutral-700">
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
