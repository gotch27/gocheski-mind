export type ExtensionToken = {
  id: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type CreatedExtensionToken = ExtensionToken & {
  token: string;
};
