const substatKeys = ["sub1", "sub2", "sub3", "sub4"] as (keyof Artifact)[];
const valueKeys = ["value1", "value2", "value3", "value4"] as (keyof Artifact)[];

type Key = ArtifactSubstatType | SubstatType

export function getArtifactTotalStats(arr: (Artifact | null)[]) {
    let stats = {} as {[key in Key]: number};
    arr.map((artifact) => {
        if (artifact === null) return;
        // Add substats
        for (let i = 0; i < substatKeys.length; i++) {
            const substat = artifact[substatKeys[i]] as ArtifactSubstatType;
            const value = artifact[valueKeys[i]] as number;
            if (substat in stats) {
                stats[substat] += value;
            } else {
                stats[substat] = value;
            }
        }
        // Add main stat
        const mainStatValue = getMainStatValue(artifact); 
        if (artifact.main in stats) {
            stats[artifact.main] += mainStatValue;
        } else {
            stats[artifact.main] = mainStatValue;
        }
    });

    // Convert all values to integers
    // for (let untypedKey in stats) {
    //     const key = untypedKey as Key;
    //     stats[key] = Math.floor(stats[key]);
    // }

    return stats;
}

export function getMainStatValue(artifact: Artifact) {
    let baseValue = 7;
    if (artifact.main === "HP") baseValue = 717;
    else if (artifact.main === "ATK") baseValue = 47;
    else if (artifact.main === "DEF%") baseValue = 8.7;
    else if (artifact.main === "EM") baseValue = 28;
    else if (artifact.main === "ER") baseValue = 7.8;
    else if (artifact.main === "CR") baseValue = 4.7;
    else if (artifact.main === "CD") baseValue = 9.3;
    else if (artifact.main === "HB") baseValue = 5.4;

    const totalValue = baseValue + (baseValue * 17/57 * (artifact.level - 1));
    return totalValue;
}
