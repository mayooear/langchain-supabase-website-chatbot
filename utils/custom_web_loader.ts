import type { CheerioAPI, load as LoadT } from 'cheerio';
import { Document } from 'langchain/document';
import { BaseDocumentLoader } from 'langchain/document_loaders';
import type { DocumentLoader } from 'langchain/document_loaders';
import { CheerioWebBaseLoader } from 'langchain/document_loaders';

export class CustomWebLoader
  extends BaseDocumentLoader
  implements DocumentLoader
{
  constructor(public webPath: string) {
    super();
  }

  static async _scrape(url: string): Promise<CheerioAPI> {
    const { load } = await CustomWebLoader.imports();
    const response = await fetch(url);
    const html = await response.text();
    return load(html);
  }

  async scrape(): Promise<CheerioAPI> {
    return CustomWebLoader._scrape(this.webPath);
  }

  async load(): Promise<Document[]> {
    const $ = await this.scrape();
    const normcontent = $('.content')
    const cmpcontent = $(".cmp-text")
    //const h3Text = $(".tab-content-text h3").text();
  //  const h4Text = $(".tab-content-text h4").text();
    const pText = $(".tab-content-text")
    const hero = $(".hero-container")

    const combinedContent = $('<div>').html(`${pText}\n${normcontent}\n${cmpcontent}\n${hero}`);
    const tabcontent = $(combinedContent)
      .clone()
      .find('div.elementor, style')
      .remove()
      .end()
      .text();

    const cleanedContent = tabcontent.replace(/\s+/g, ' ').trim();

    const contentLength = cleanedContent?.match(/\b\w+\b/g)?.length ?? 0;
    const metadata = { source: this.webPath, contentLength };

    return [new Document({ pageContent: cleanedContent, metadata })];
  }



  static async imports(): Promise<{
    load: typeof LoadT;
  }> {
    try {
      const { load } = await import('cheerio');
      return { load };
    } catch (e) {
      console.error(e);
      throw new Error(
        'Please install cheerio as a dependency with, e.g. `yarn add cheerio`',
      );
    }
  }
}
