export interface Citation {
  title: string;
  url: string;
  content: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  _showCitations?: boolean;
}
