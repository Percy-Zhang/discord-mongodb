function getRandElem(arr: Array<number>) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function incArtiSubstat(substat: ArtifactSubstatType) {
    switch (substat) {
    case "HP": return getRandElem([300, 400, 500, 600]);
    case "ATK": return getRandElem([22, 28, 34, 40]);
    case "DEF": return getRandElem([30, 36, 42, 50]);
    case "HP%": return getRandElem([4, 5, 6, 7]);
    case "ATK%": return getRandElem([4, 5, 6, 7]);
    case "DEF%": return getRandElem([6, 7, 8, 9]);
    case "EM": return getRandElem([16, 18, 21, 23]);
    case "ER": return getRandElem([5, 6, 7]);
    case "CR": return getRandElem([2, 3, 3, 4]);
    case "CD": return getRandElem([5, 6, 7, 8]);
    }
}
