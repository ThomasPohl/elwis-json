import * as cheerio from 'cheerio';
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export class SbfParser {

    async getJsonData(siteContent){
        const $ = cheerio.load(siteContent);
        const data = [];
        let question = {};
        $('p.wsv-red.line').nextUntil('div.sectionRelated').each((i, el) => {

            if ($(el).is('p:not([class])')) {
                let tagContent = $(el).text();
                let match = tagContent.match(/\n(\d+)\.(.+)/);
                if (match) {
                    let id = match[1];
                    let text = match[2];
                    question = { id, text }
                }
            }
            else if ($(el).is('p.picture')) {
                let imgSrc = $(el).find('span img').attr('src');
                question.imageSrc = imgSrc;
            } else if ($(el).is('ol')) {
                let answers = [];
                $(el).find('li').each((i, el) => {
                    let answer = $(el).text();
                    answer = answer.replace(/\n/g, '');
                    answers.push(answer);
                });
                question.answers = answers;
                data.push(question);
                question = {};
            }
        });
        return data;
    }

    async getDistributionJson(data) {
        //Parse PDF using pdf.js
        const uint8Array = new Uint8Array(data);
    
        let distributionData = [];
    
        const loadingTask = getDocument(uint8Array);
        const pdf = await loadingTask.promise;
        for (let currentPage = 1; currentPage <= pdf.numPages; currentPage++) {
            const page = await pdf.getPage(currentPage);
            const content = await page.getTextContent();
            for (let i = 0; i < content.items.length; i++) {
                const item = content.items[i];
                if (item.str.match(/^Fragebogen \d+:/)) {
                    let questionaireNumber = item.str.split(" ")[1];
                    let questionIds = [];
                    let j = i + 1;
                    while (j < content.items.length && (content.items[j].str.match(/^\d+|^\s*/))) {
                        if (content.items[j].str.match(/^\d+$/)) {
                            questionIds.push(content.items[j].str);
                        }
                        j++;
                    }
                    distributionData.push({ "id": questionaireNumber, "questions": questionIds });
                }
            }
        }
        return distributionData;
        
    
    
    }
}


