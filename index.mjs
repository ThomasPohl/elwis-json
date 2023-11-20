import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";


const questionsData = {
    "Sportbootfuehrerscheine Binnen": {
        "type": "SBF",
        "questions": {
            "Basisfragen": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Basisfragen/Basisfragen-node.html" },
            "Spezifische Fragen": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Spezifische-Fragen-Binnen/Spezifische-Fragen-Binnen-node.html" },
            "Spezifische Fragen Segeln": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Spezifische-Fragen-Segeln/Spezifische-Fragen-Segeln-node.html" }
        },
        "distribution": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenverteilung-Binnen.pdf?__blob=publicationFile&v=3" }
    },
    "Sportbootfuehrerscheine See": {
        "type": "SBF",
        "questions": {
            "Basisfragen": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-See/Basisfragen/Basisfragen-node.html" },
            "Spezifische Fragen": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-See/Spezifische-Fragen-See/Spezifische-Fragen-See-node.html" }
        },
        "distribution": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenverteilung-See.pdf?__blob=publicationFile&v=3" }
    },
    "Sportküstenschifferschein (SKS)": {
        "type": "SBF",
        "questions": {
            "Navigation": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS/Navigation/Navigation-node.html" },
            "Schifffahrtsrecht": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS/Schifffahrtsrecht/Schifffahrtsrecht-node.html" },
            "Wetterkunde": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS/Wetterkunde/Wetterkunde-node.html" },
            "Seemannschaft I": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS/Seemannschaft-I/Seemannschaft-I-node.html" },
            "Seemannschaft II": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS/Seemannschaft-II/Seemannschaft-II-node.html" }
        }
    },
    "Short Range Certificate (SRC)": {
        "type": "Funk",
        "questions": {
            "Fragenkatalog": { "url": "https://elwis.de/DE/Schifffahrtsrecht/Sprechfunkzeugnisse/Fragenkatalog-SRC-2018.pdf?__blob=publicationFile&v=3" }
        }
    }
};

async function convertToJson(siteContent, type) {
    if (type === "SBF") {
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
    } else if (type === "Funk") {
        console.log("Converting Funk");
        const skipPatterns = [
            /^Gesamtfragen.*/,
            /^Alle Rechte vorbehalten.*/,
            /^Stand\:.*/
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
                            i++
                        }
                    }
                    pdfLines.push(text);
                    if (skipPatterns.some((pattern) => text.match(pattern))) {
                        continue;
                    }

                    if (text.match(/^\d+\./)){
                        if (question) {
                            data.push(question);
                        }
                        beforeAnswers = true;
                        let dotIndex = text.indexOf('.');
                        question = { id: text.substring(0, dotIndex), text: text.substring(dotIndex + 2).replace(/ \[\d+\]/g, ''), answers: [] };
                    } else if (text.match(/^\d\)/)) {
                        beforeAnswers = false;
                        let braceIndex = text.indexOf(')');
                        question.answers.push(text.substring(braceIndex + 2));
                    } else if (beforeAnswers) {
                        question.text += " " + text.replace(/ ?\[\d+\]/g, '');
                    } else if (question) {
                        question.answers[question.answers.length - 1] += " " + text;
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

async function downloadAndCache(src) {
    let fileName = src.split('/').pop();
    fileName = fileName.split('?')[0];
    try {
        await fs.access('./cache/' + fileName);
    } catch (error) {
        let response = await axios.get(src, { responseType: 'arraybuffer' });
        await fs.writeFile('./cache/' + fileName, response.data);
    }
    return await fs.readFile('./cache/' + fileName);
}

async function getQuestionsData(examName, category, type) {

    console.log("Downloading " + examName + " " + category);
    let data = await downloadAndCache(questionsData[examName]["questions"][category].url);
    let jsonData = await convertToJson(data, type);
    for (let i = 0; i < jsonData.length; i++) {
        if (jsonData[i].imageSrc) {

            jsonData[i].imageSrc = 'data:image/gif;base64,' + (await downloadAndCache(jsonData[i].imageSrc)).toString('base64');
        }
    }
    await fs.writeFile('./data/' + examName + "-" + category + '.json', JSON.stringify(jsonData));
    console.log('The json file ' + examName + "-" + category + '.json has been saved!');
}

async function getAllQuestionsData() {
    let promises = [];
    for (let examName in questionsData) {
        for (let category in questionsData[examName].questions) {
            promises.push(getQuestionsData(examName, category, questionsData[examName].type));
        }
        if (questionsData[examName].distribution) {
            await createDistributionJson(examName);
        }
    }
    await Promise.all(promises);
}

async function createDistributionJson(examName) {
    //Distribution data is pdf
    let data = await downloadAndCache(questionsData[examName]["distribution"].url);
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

    await fs.writeFile('./data/' + examName + "-distribution.json", JSON.stringify(distributionData));
    console.log('The json file ' + examName + "-distribution.json has been saved!");


}

async function buildIndex() {
    //CReate a JSON saved in index.html which contains all the exam names and categories with their corresponding github pages url
    let index = [];
    for (let examName in questionsData) {
        let exam = { "name": examName, "categories": [] };
        for (let category in questionsData[examName].questions) {
            exam.categories.push({ "name": category, "url": "https://thomaspohl.github.io/elwis-json/" + encodeURIComponent(examName + "-" + category + ".json") });
        }
        if (questionsData[examName].distribution) {
            exam.distribution = "https://thomaspohl.github.io/elwis-json/" + encodeURIComponent(examName + "-distribution.json");
        }
        index.push(exam);
    }
    await fs.writeFile('./data/index.html', JSON.stringify(index));
    index["fromJson"] = true;
    await fs.writeFile('./data/index.json', JSON.stringify(index));

}

await getAllQuestionsData();
await buildIndex();
