import {getDocument} from "pdfjs-dist/legacy/build/pdf.mjs";

export class FunkParser {

    async getJsonData(siteContent, categoryMode) {
        console.log("==== Loding Funk ====");
        const skipPatterns = [
            /^Gesamtfragen.*/,
            /^Alle Rechte vorbehalten.*/,
            /^Stand\:.*/,
            /^nur mit ausdr.*/,
            /^Mobiler Seefunkdienst für das beschränkt gültige Funkbetriebszeugnis \(Short Range Certificate, SRC\)$/,
            /^Fragenkatalog für das allgemeine Funkbetriebszeugnis \(Long Range Certificate – LRC\)$/,
            /^FRAGENKATALOG FÜR DAS UKW-SPRECHFUNKZEUGNIS \(UBI\) \/ STAND: 08\/23$/,
            /^für das allgemeine Funkbetriebszeugnis \(Long Range Certificate – LRC\)$/,
            /^Mobiler Seefunkdienst und Mobiler Seefunkdienst über Satelliten$/,
            /^.*Richtig ist immer.*/,
            /^.*redaktionellen Servic.*/,
            /^.*Verkehrsblatt.*/,
        ]
        //Parse as PDF
        const uint8Array = new Uint8Array(siteContent);
        const loadingTask = getDocument(uint8Array);
        const pdf = await loadingTask.promise;
        const data = {};
        let question = null;
        let pdfLines = [];
        let unprocessedCatText = null;
        let beforeAnswers = false;
        let categoriesPage = false;
        let categories = [];

        for (let currentPage = 1; currentPage <= pdf.numPages; currentPage++) {
            if (categoriesPage) {
                console.log("Exiting Categories Page");
                categoriesPage = false;
            }
            const page = await pdf.getPage(currentPage);
            const content = await page.getTextContent();
            for (let i = 0; i < content.items.length; i++) {
                const item = content.items[i];
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
                if (text.trim().match(/^.*FRAGENKATALOG.*/i)) {
                    console.log("Entering Categories Page " + text);
                    categoriesPage = true;
                } else if (text.match(/.*\s+.*Fragen.*/)) {
                    console.log("Category: " + text);
                    let catEndIndex = text.indexOf("…");
                    if (catEndIndex === -1) {
                        catEndIndex = text.indexOf("..");
                    }
                    if (catEndIndex === -1) {
                        catEndIndex = text.indexOf("Fragen");
                    }
                    let catName = text.substring(0, catEndIndex).trim();
                    if (unprocessedCatText != null && categoryMode === "idInSuffix") {
                        catName = unprocessedCatText + " " + catName;
                        unprocessedCatText = null;

                    }
                    catName = catName.replace(/[<>:"\/\\|?*]/g, '_');
                    console.log("CatName: " + catName);
                    let questionsStr = text.substring(text.indexOf("Fragen ") + 7);
                    let startQuestion = parseInt(questionsStr.substring(0, questionsStr.indexOf(" ")), 10);
                    let endQuestionMatch = questionsStr.match(/ [-–] (\d+)/);
                    let endQuestion = endQuestionMatch ? parseInt(endQuestionMatch[1], 10) : null;
                    console.log("Start: " + startQuestion + " End: " + endQuestion);
                    categories.push({name: catName, start: startQuestion, end: endQuestion});
                } else if (categoriesPage && categoryMode !== "inline") {
                    console.log("Unprocessed CatText: " + text);
                    if (categoryMode === "idInPrefix") {
                        categories[categories.length - 1].name += " " + text;
                        console.log("appended CatName: " + categories[categories.length - 1].name);
                    } else if (categoryMode === "idInSuffix") {
                        if (unprocessedCatText == null) {
                            unprocessedCatText = text;
                        } else {
                            unprocessedCatText += " " + text;
                        }
                    } else {
                        console.log("Unknown category mode: " + categoryMode);
                    }
                } else if (text.match(/^\d+\./)) {
                    //console.log(text);
                    if (question) {
                        this.save(data, question, categories);
                    }
                    beforeAnswers = true;
                    let dotIndex = text.indexOf('.');
                    question = {
                        id: text.substring(0, dotIndex),
                        text: text.substring(dotIndex + 2).replace(/ \[\d+\]/g, ''),
                        answers: []
                    };
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
            this.save(data, question, categories);
        }
        /*data.forEach((cat, questions) => {
            //console.log("Category: " + cat);
            questions.forEach((question) => {
                if (question.answers.length != 4) {
                    console.log(question.id);
                }
            });
        })*/
        return data;
    }

    save(data, question, categories) {
        let cat = categories.find((cat) => cat.start <= question.id && (!cat.end || cat.end >= question.id)).name;
        if (!cat) {
            console.log("Category not found for question " + question.id);
            cat = "Unknown";
        }
        if (!data[cat]) {
            data[cat] = [];
        }
        data[cat].push(question);
    }
}