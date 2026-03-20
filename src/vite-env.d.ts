/// <reference types="vite/client" />

interface AppleSignInResponse {
  authorization: {
    id_token: string;
    code: string;
    state?: string;
  };
  user?: {
    email?: string;
    name?: { firstName?: string; lastName?: string };
  };
}

interface AppleIDAuth {
  init(config: {
    clientId: string;
    scope: string;
    redirectURI: string;
    usePopup: boolean;
  }): void;
  signIn(): Promise<AppleSignInResponse>;
}

declare namespace AppleID {
  const auth: AppleIDAuth;
}
