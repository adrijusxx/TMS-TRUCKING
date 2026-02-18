export interface HelpTopic {
  id: string;
  title: string;
  summary: string;
  content: string;
}

export interface HelpModule {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  topics: HelpTopic[];
}
