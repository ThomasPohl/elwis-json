import axios from 'axios';

import fs from 'fs/promises';
import { SbfParser } from './sbf.mjs';
import { FunkParser } from './funk.mjs';
import { questionsData } from './config.mjs';



async function convertToJson(siteContent, type) {
    if (type === "SBF") {
        return new SbfParser().getJsonData(siteContent);
       
    } else if (type === "Funk") {
        return new FunkParser().getJsonData(siteContent);
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
        if (questionsData[examName].skip) {
            continue;
        }
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
   

    let distributionData = new SbfParser().getDistributionJson(data);

    await fs.writeFile('./data/' + examName + "-distribution.json", JSON.stringify(distributionData));
    console.log('The json file ' + examName + "-distribution.json has been saved!");


}

async function buildIndex() {
    //Create a JSON saved in index.html which contains all the exam names and categories with their corresponding github pages url
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
