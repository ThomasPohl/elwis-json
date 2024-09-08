const questionsData = {
    "Sportbootfuehrerscheine Binnen": {
        "type": "SBF",
        "shortName": "SBF Binnen",
        "questions": {
            "Basisfragen": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Basisfragen/Basisfragen-node.html" },
            "Spezifische Fragen": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Spezifische-Fragen-Binnen/Spezifische-Fragen-Binnen-node.html" },
            "Spezifische Fragen Segeln": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Spezifische-Fragen-Segeln/Spezifische-Fragen-Segeln-node.html" }
        },
        "distribution": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenverteilung-Binnen.pdf?__blob=publicationFile&v=3" }
    },
    "Sportbootfuehrerscheine See": {
        "type": "SBF",
        "shortName": "SBF See",
        "questions": {
            "Basisfragen": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-See/Basisfragen/Basisfragen-node.html" },
            "Spezifische Fragen": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-See/Spezifische-Fragen-See/Spezifische-Fragen-See-node.html" }
        },
        "distribution": { "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenverteilung-See.pdf?__blob=publicationFile&v=3" }
    },
    "Sportküstenschifferschein (SKS)": {
        "type": "SBF",
        "shortName": "SKS",
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
        "shortName": "SRC",
        "questions": {
            "Fragenkatalog": { "url": "https://elwis.de/DE/Schifffahrtsrecht/Sprechfunkzeugnisse/Fragenkatalog-SRC-2018.pdf?__blob=publicationFile&v=3" }
        }
    },
    "Long Range Certificate (LRC)": {
        "shortName": "LRC",
        "type": "Funk",
        "questions": {
            "Fragenkatalog": { "url": "https://www.elwis.de/DE/Schifffahrtsrecht/Sprechfunkzeugnisse/Fragenkatalog-LRC-2018.pdf?__blob=publicationFile&v=4" }
        }
    },
    "UKW Sprechfunkzeugnis für den Binnenschifffahrtsfunk (UBI)": {
        "type": "Funk",
        "shortName": "UBI",
        "questions": {
            "Fragenkatalog": { "url": "https://www.abvt.wsv.de/Webs/WSA/ABVT/DE/SharedDocs/Downloads/UBI_Gesamtfragenkatalog_2023-08-16.pdf?__blob=publicationFile&v=7" }
        },
        "training": { 
            "questions": "https://www.abvt.wsv.de/Webs/WSA/ABVT/DE/SharedDocs/Downloads/UBI_Uebungsfrageboegen_2022-06-22.pdf?__blob=publicationFile&v=6",
            "answers": "https://www.abvt.wsv.de/Webs/WSA/ABVT/DE/SharedDocs/Downloads/UBI_Uebungsfrageboegen_2018-10-11-Antworten.pdf?__blob=publicationFile&v=4"

        }
    }
};
export { questionsData };