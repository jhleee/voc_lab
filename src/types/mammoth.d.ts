declare module 'mammoth' {
  interface ExtractRawTextOptions {
    path?: string;
    buffer?: Buffer;
  }

  interface ExtractRawTextResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export function extractRawText(
    options: ExtractRawTextOptions
  ): Promise<ExtractRawTextResult>;

  interface ConvertToHtmlOptions {
    path?: string;
    buffer?: Buffer;
  }

  interface ConvertToHtmlResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export function convertToHtml(
    options: ConvertToHtmlOptions
  ): Promise<ConvertToHtmlResult>;
}
