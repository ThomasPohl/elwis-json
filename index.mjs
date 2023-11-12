import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises'; 
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";


const questionsData = {
    "Sportbootfuehrerscheine Binnen": {
        "Basisfragen": {"file": "basisfragenBinnen.html", "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Basisfragen/Basisfragen-node.html"},
        "Spezifische Fragen": {"file": "spezifischeFragenBinnen.html", "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Spezifische-Fragen-Binnen/Spezifische-Fragen-Binnen-node.html"},
        "Spezifische Fragen Segeln": {"file": "spezifischeFragenSegeln.html", "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Spezifische-Fragen-Segeln/Spezifische-Fragen-Segeln-node.html"},
        "distribution": {"file":"FragenverteilungBinnen.pdf", "url":"https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenverteilung-Binnen.pdf?__blob=publicationFile&v=3"}
    },
    "Sportbootfuehrerscheine See": {
        "Basisfragen": {"file": "basisfragenSee.html", "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-See/Basisfragen/Basisfragen-node.html"},
        "Spezifische Fragen": {"file": "spezifischeFragenSee.html", "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-See/Spezifische-Fragen-See/Spezifische-Fragen-See-node.html"},
        "distribution": {"file":"FragenverteilungSee.pdf", "url":"https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenverteilung-See.pdf?__blob=publicationFile&v=3"}
    },
};

async function convertToJson(siteContent){
    const $ = cheerio.load(siteContent);
    const data = [];
    let question = {};
    $('p.wsv-red.line').nextUntil('div.sectionRelated').each((i, el) => {
        
        if ($(el).is('p:not([class])')){
            let tagContent = $(el).text();
            let match = tagContent.match(/\n(\d+)\.(.+)/);
            if (match) {
                let id = match[1];
                let text = match[2];
                question = {id, text}
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

async function getQuestionsData(examName, category) {

    let data = await downloadAndCache(questionsData[examName][category].url);
    let jsonData = await convertToJson(data);
    for (let i = 0; i < jsonData.length; i++) {
        if (jsonData[i].imageSrc) {

            jsonData[i].imageSrc = 'data:image/gif;base64,' +  (await downloadAndCache(jsonData[i].imageSrc)).toString('base64');
        }
    }
    await fs.writeFile('./data/' + examName + "-" + category + '.json', JSON.stringify(jsonData));
    console.log('The json file ' + examName + "-" + category + '.json has been saved!');
}

async function getAllQuestionsData() {
    let promises = [];
    for (let examName in questionsData) {
        for (let category in questionsData[examName]) {
            if (category === "distribution") {
                await createDistributionJson(examName);
            } else{
                promises.push(getQuestionsData(examName, category));
            }
        }
    }
    await Promise.all(promises);
}

async function createDistributionJson(examName) {
    //Distribution data is pdf
    let data = await downloadAndCache(questionsData[examName]["distribution"].url);
    //Parse PDF using pdf.js
    const uint8Array = new Uint8Array(data);

    let distributionData = {};
    
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
                    if (content.items[j].str.match(/^\d+$/)){
                        questionIds.push(content.items[j].str);
                    }
                    j++;
                }
                distributionData[questionaireNumber] = questionIds;
            }
        }
    }

    await fs.writeFile('./data/' + examName + "-distribution.json", JSON.stringify(distributionData));
    console.log('The json file ' + examName + "-distribution.json has been saved!");


}

getAllQuestionsData().then(() => {
    console.log("finished");
});