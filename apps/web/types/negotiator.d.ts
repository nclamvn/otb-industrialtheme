declare module 'negotiator' {
  interface Headers {
    [key: string]: string | string[] | undefined;
  }

  class Negotiator {
    constructor(request: { headers: Headers });
    charsets(available?: string[]): string[];
    charset(available?: string[]): string | undefined;
    encodings(available?: string[]): string[];
    encoding(available?: string[]): string | undefined;
    languages(available?: string[]): string[];
    language(available?: string[]): string | undefined;
    mediaTypes(available?: string[]): string[];
    mediaType(available?: string[]): string | undefined;
  }

  export = Negotiator;
}
