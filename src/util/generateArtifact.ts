import { incArtiSubstat } from "./increaseArtiSubstat";

const artifactType : ArtifactType[] = ["flower", "feather", "sands", "goblet", "circlet"];
const sandsType = ["ATK%", "HP%", "EM", "DEF%", "ER"];
const gobletType = ["ATK%", "HP%", "EM", "DEF%", "ANEMO%", "GEO%", "ELECTRO%", "DENDRO%", "HYDRO%", "PYRO%", "CRYO%", "PHYS%"];
const circletType = ["ATK%", "HP%", "EM", "DEF%", "CR", "CD"];
const substats = ["ATK%", "HP%", "EM", "DEF%", "ER", "CR", "CD", "ATK", "HP", "DEF"];
const sets = ["Heart of Depth", "Crimson Witch of Flames", "Blizzard Strayer"];

function getRandElem(arr: Array<any>, exclude: Array<any> = []) {
    let filtered = arr.filter((elem) => !exclude.includes(elem)); 
    return filtered[Math.floor(Math.random() * filtered.length)];
}

function getMainstat(type: ArtifactType) {
    switch (type) {
    case "flower":
        return "HP";
    case "feather":
        return "ATK";
    case "sands":
        return getRandElem(sandsType);
    case "goblet":
        return getRandElem(gobletType);
    case "circlet":
        return getRandElem(circletType);
    }
}

export function generateArtifact() {
    const type : ArtifactType = getRandElem(artifactType);
    const set = getRandElem(sets);
    const main = getMainstat(type);
    const sub1 = getRandElem(substats);
    const sub2 = getRandElem(substats, [sub1]);
    const sub3 = getRandElem(substats, [sub1, sub2]);
    const sub4 = getRandElem(substats, [sub1, sub2, sub3]);

    const artifact = {
        type,
        set,
        level: 1,
        main,
        sub1,
        sub2,
        sub3,
        sub4,
        value1: incArtiSubstat(sub1),
        value2: incArtiSubstat(sub2),
        value3: incArtiSubstat(sub3),
        value4: incArtiSubstat(sub4),
        equipped: null,
    } as Artifact;

    return artifact;
}
