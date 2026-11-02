declare module 'next/server' {
  export class NextResponse extends Response {
    static json(data: any, init?: ResponseInit): Response;
    static redirect(url: string | URL, status?: number): Response;
    static next(init?: ResponseInit): NextResponse;
    cookies: {
      set(name: string, value: string, options?: any): void;
      delete(name: string): void;
    };
  }
  export type NextRequest = Request & {
    cookies: {
      get(name: string): { value: string } | undefined;
    };
  };
}
