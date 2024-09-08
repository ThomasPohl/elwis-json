import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export class FunkParser {

    async getJsonData(siteContent){
        console.log("==== Loding Funk ====");
        const skipPatterns = [
            /^Gesamtfragen.*/,
            /^Alle Rechte vorbehalten.*/,
            /^Stand\:.*/,
            /^FRAGENKATALOG.*/,
            /^nur mit ausdr.*/,
        ]
        //Parse as PDF
        const uint8Array = new Uint8Array(siteContent);
        const loadingTask = getDocument(uint8Array);
        const pdf = await loadingTask.promise;
        const data = [];
        let question = null;
        let pdfLines = [];
        let beforeAnswers = false;

        for (let currentPage = 1; currentPage <= pdf.numPages; currentPage++) {
            const page = await pdf.getPage(currentPage);
            const content = await page.getTextContent();
            for (let i = 0; i < content.items.length; i++) {
                const item = content.items[i];
                //Beinhaltet "1."
                //console.log(item);
                    //Concat all non EOL lines
                    let text = item.str;
                    
                    if (i < content.items.length && !item.hasEOL) {
                          i++                        
                        while (i < content.items.length && !content.items[i].hasEOL) {
                            //console.log(content.items[j].hasEOL);
                            text += content.items[i].str;
                            i++;
                        }
                    }
                    pdfLines.push(text);
                    if (skipPatterns.some((pattern) => text.match(pattern))) {
                        continue;
                    }

                    if (text.match(/^\d+\./)){
                        //console.log(text);
                        if (question) {
                            data.push(question);
                        }
                        beforeAnswers = true;
                        let dotIndex = text.indexOf('.');
                        question = { id: text.substring(0, dotIndex), text: text.substring(dotIndex + 2).replace(/ \[\d+\]/g, ''), answers: [] };
                        //console.log("Question: "+question.id+":" + question.text);
                        //console.log("Question: "+question.id);
                        
                    } else if (text.match(/^.\)/)) {
                        beforeAnswers = false;
                        let braceIndex = text.indexOf(')');
                        question.answers.push(text.substring(braceIndex + 2));
                        //console.log("Answer: "+question.answers[question.answers.length - 1]);
                    } else if (beforeAnswers) {
                        //console.log("Questionextension: "+question.text);
                        question.text += " " + text.replace(/ ?\[\d+\]/g, '');
                    } else if (question) {
                        question.answers[question.answers.length - 1] += " " + text;
                        //console.log("Answerextension: "+question.answers[question.answers.length - 1]);
                    }

                
               
            }
            
        }
        if (question) {
            data.push(question);
        }
        data.forEach((question) => {
            if (question.answers.length != 4){
                console.log(question.id);
            }
        });
        return data;
    }
}