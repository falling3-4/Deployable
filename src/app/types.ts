export interface Tab {
  id: string;
  url: string;
  history: string[];
  historyIndex: number;
  frame: HTMLIFrameElement;
  tabElement: HTMLElement;
  sjFrame: any;
}
