import { Card } from "@/components/ui/Card";

interface CompareNoticeProps {
  children: string;
  className?: string;
}

export function CompareNotice({ children, className }: CompareNoticeProps) {
  return (
    <Card variant="notice" className={className}>
      {children}
    </Card>
  );
}
