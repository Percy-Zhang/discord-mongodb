type ObjectId = import("mongodb").ObjectId
type WeaponType = "bow" | "polearm" | "catalyst" | "sword" | "claymore"
type ArtifactType = "flower" | "feather" | "sands" | "goblet" | "circlet"
type SubstatType = "CR" | "CD" | "ATK%" | "HP%" | "DEF%" | "ER" | "EM" | "ANEMO" | "GEO" | "ELECTRO" | "DENDRO" | "HYDRO" | "PYRO" | "CRYO" | "PHYS" | "HB"
type HeightType = "tall" | "medium" | "short"
type Sex = "male" | "female"
type ElementType = "anemo" | "geo" | "electro" | "dendro" | "hydro" | "pyro" | "cryo"
type AdventureType = "domain" | "commission" | "expedition"
type ArtifactSet = "Heart of Depth" | "Crimson Witch of Flames" | "Blizzard Strayer"
type SandsMainstatType = "ATK%" | "HP%" | "EM" | "DEF%" | "ER" 
type GobletMainstatType = "ATK%" | "HP%" | "EM" | "DEF%" | "ANEMO" | "GEO" | "ELECTRO" | "DENDRO" | "HYDRO" | "PYRO" | "CRYO" | "PHYS"
type CircletMainstatType = "ATK%" | "HP%" | "EM" | "DEF%" | "CR" | "CD" | "HB"
type ArtifactSubstatType = "ATK%" | "HP%" | "EM" | "DEF%" | "ER" | "CR" | "CD" | "ATK" | "HP" | "DEF"

interface UserProfile {
    _id: ObjectId
    id: string
    coins: number
    name: string
    uid: string
    guarantee: {
        four: boolean
        five: boolean
    }
    pity: {
        four: number
        five: number
    }
    adventure: {
        type: null | AdventureType
        start: null | Date
        character: null | string
    }
}

interface Character {
    _id: ObjectId
    level: number
    name: string
    rarity: number
    constellations: number
    weapon: ObjectId | null
    flower: ObjectId | null
    feather: ObjectId | null
    sands: ObjectId | null
    goblet: ObjectId | null
    circlet: ObjectId | null
    talent1: number
    talent2: number
    talent3: number
    type: WeaponType
}

interface Weapon {
    _id: ObjectId
    name: string
    level: number
    refinement: number
    equipped: string | null
    rarity: number
    type: WeaponType
}

interface Artifact {
    _id: ObjectId
    type: ArtifactType
    set: ArtifactSet
    level: number
    main: "HP" | "ATK" | SandsMainstatType | GobletMainstatType | CircletMainstatType
    sub1: ArtifactSubstatType
    sub2: ArtifactSubstatType
    sub3: ArtifactSubstatType
    sub4: ArtifactSubstatType
    value1: number
    value2: number
    value3: number
    value4: number
    equipped: string | null
}

interface WishHistory {
    _id: ObjectId
    banner: number
    name: string
    rarity: number
    pity: number
    date: Date
}

interface CharArchive {
    _id: ObjectId
    name: string
    rarity: number
    element: ElementType
    type: WeaponType
    base_atk: number
    substat: SubstatType
    substat_value: number
    height: HeightType
    sex: SexType
    base_def: number
    base_hp: number
    limited: Boolean
    banner: string
    title: string
}

interface WeapArchive {
    _id: ObjectId
    name: string
    rarity: number
    type: WeaponType
    main: number
    substat: SubstatType
    substat_value: number
    limited: Boolean
}

interface Banner {
    _id: ObjectId
    banner: number
    data: string[]
}
