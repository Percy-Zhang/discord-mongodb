import { getArtifactTotalStats, getMainStatValue } from "./getArtifactTotalSubstats";
import { connectToDB } from "./mongodb";

type ElementT = "ANEMO" | "GEO" | "ELECTRO" | "DENDRO" | "HYDRO" | "PYRO" | "CRYO" | "PHYS"
type SubstatsObject = {[key in SubstatType]: number | undefined}

export async function getCharStats(id: string, name: string) {
    const { client } = await connectToDB();
    const weapCol = client.db(id).collection<Weapon>("weapons");
    const artiCol = client.db(id).collection<Artifact>("artifacts");
    const weapArchiveCol = client.db("archive").collection<WeapArchive>("weapons");
    const charArvhiveCol = client.db("archive").collection<CharArchive>("characters");
    
    const character = await client.db(id).collection<Character>("characters").findOne({ name });
    if (character === null) return {};

    const [weapon, flower, feather, sands, goblet, circlet] = await Promise.all([
        weapCol.findOne({ id: character.weapon ?? undefined }),
        artiCol.findOne({ _id: character.flower ?? undefined }),
        artiCol.findOne({ _id: character.feather ?? undefined }),
        artiCol.findOne({ _id: character.sands ?? undefined }),
        artiCol.findOne({ _id: character.goblet ?? undefined }),
        artiCol.findOne({ _id: character.circlet ?? undefined }),
    ]);

    const [charInfo, weapInfo] = await Promise.all([
        charArvhiveCol.findOne({ name }),
        weapArchiveCol.findOne({ name: weapon?.name }),
    ]);

    if (charInfo === null) return {};

    const artifactStats = getArtifactTotalStats([flower, feather, sands, goblet, circlet]);
    const weaponStats = weapInfo === null || weapon === null 
        ? {} as SubstatsObject
        : { [weapInfo.substat]: weapInfo.substat_value * weapon.level / 19.6 } as SubstatsObject;
    const characterStats = charInfo === null || character === null
        ? {} as SubstatsObject
        : { [charInfo.substat]: charInfo.substat_value * character.level / 19.6 } as SubstatsObject;

    // ATK calculations
    const charBaseAtk = (charInfo?.base_atk ?? 0) * character.level / 7;
    const charPctAtk = characterStats["ATK%"] ?? 0;
    const weapBaseAtk = Math.floor(((weapInfo?.main ?? 16) - 16) ** (1.065 * ((weapon?.level ?? 0) / 50.717)));
    const weapPctAtk = weaponStats["ATK%"] ?? 0;
    const artiFlatAtk = artifactStats.ATK ?? 0;
    const artiPctAtk = artifactStats["ATK%"] ?? 0;

    // HP calculations
    const charBaseHp = (charInfo?.base_hp ?? 1) * character.level / 7.54;
    const charPctHp = characterStats["HP%"] ?? 0;
    const weapPctHp = weaponStats["HP%"] ?? 0;
    const artiFlatHp = artifactStats.HP ?? 0;
    const artiPctHp = artifactStats["HP%"] ?? 0;

    // DEF calculations
    const charBaseDef = (charInfo?.base_def ?? 0) * character.level / 6.91;
    const charPctDef = characterStats["DEF%"] ?? 0;
    const weapPctDef = weaponStats["DEF%"] ?? 0;
    const artiFlatDef = artifactStats.DEF ?? 0;
    const artiPctDef = artifactStats["DEF%"] ?? 0;

    // ER calculations
    const charEr = characterStats.ER ?? 0;
    const weapEr = weaponStats.ER ?? 0;
    const artiEr = artifactStats.ER ?? 0;

    // EM calculations
    const charEm = characterStats.EM ?? 0;
    const weapEm = weaponStats.EM ?? 0;
    const artiEm = artifactStats.EM ?? 0;

    // CR calculations
    const charCr = characterStats.CR ?? 0;
    const weapCr = weaponStats.CR ?? 0;
    const artiCr = artifactStats.CR ?? 0;

    // CD calculations
    const charCd = characterStats.CD ?? 0;
    const weapCd = weaponStats.CD ?? 0;
    const artiCd = artifactStats.CD ?? 0;

    // HB calculations
    const charHb = characterStats.HB ?? 0;
    const weapHb = weaponStats.HB ?? 0;
    const artiHB = artifactStats.HB ?? 0;

    // Elemental Damage calculations
    const ELEMENTS : ElementT[] = ["ANEMO", "GEO", "ELECTRO", "DENDRO", "HYDRO", "PYRO", "CRYO", "PHYS"];
    let TOTAL_ELEM_DMG = {} as {[key in ElementT]: number};
    for (let element of ELEMENTS) {
        TOTAL_ELEM_DMG[element] = characterStats[element] ?? 0;
    }

    const TOTAL_BASE_ATK = charBaseAtk + weapBaseAtk;
    const TOTAL_PCT_ATK = 100 + charPctAtk + weapPctAtk + artiPctAtk;
    const TOTAL_PCT_HP = 100 + charPctHp + weapPctHp + artiPctHp;
    const TOTAL_PCT_DEF = 100 + charPctDef + weapPctDef + artiPctDef;

    const TOTAL_ATK = TOTAL_BASE_ATK * TOTAL_PCT_ATK / 100 + artiFlatAtk;
    const TOTAL_HP = charBaseHp * TOTAL_PCT_HP / 100 + artiFlatHp;
    const TOTAL_DEF = charBaseDef * TOTAL_PCT_DEF / 100 + artiFlatDef;
    const TOTAL_ER = 100 + charEr + weapEr + artiEr;
    const TOTAL_EM = charEm + weapEm + artiEm;
    const TOTAL_CR = 5 + charCr + weapCr + artiCr;
    const TOTAL_CD = 50 + charCd + weapCd + artiCd;
    const TOTAL_HB = charHb + weapHb + artiHB;

    return {
        name: character.name,
        level: character.level,
        constellation: character.constellations,
        type: character.type,
        rarity: character.rarity,
        element: charInfo.element,
        height: charInfo.height,
        title: charInfo.title,
        weapon: weapon === null ? undefined : { ...weapon, ...weapInfo, main: weapBaseAtk, substat_value: Object.values(weaponStats)[0] },
        flower: flower === null ? undefined : { ...flower, value: getMainStatValue(flower) },
        feather: feather === null ? undefined : { ...feather, value: getMainStatValue(feather) },
        sands: sands === null ? undefined : { ...sands, value: getMainStatValue(sands) },
        goblet: goblet === null ? undefined : { ...goblet, value: getMainStatValue(goblet) },
        circlet: circlet === null ? undefined : { ...circlet, value: getMainStatValue(circlet) },
        BASE_ATK: TOTAL_BASE_ATK,
        PCT_ATK: TOTAL_PCT_ATK,
        FLAT_ATK: artiPctAtk,
        BASE_HP: charBaseHp,
        PCT_HP: TOTAL_PCT_HP,
        BASE_DEF: charBaseDef,
        PCT_DEF: TOTAL_PCT_DEF,
        ER: TOTAL_ER,
        EM: TOTAL_EM,
        CR: TOTAL_CR,
        CD: TOTAL_CD,
        ...TOTAL_ELEM_DMG,
        HB: TOTAL_HB,
    };
}
