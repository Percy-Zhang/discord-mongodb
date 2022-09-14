interface UserProfile {
    _id: string
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
}

interface Character {
    _id: string
    level: number
    name: string
    rarity: number
    constellations: number
    weapon: string
    artifacts: {
        0?: string
        1?: string
        2?: string
        3?: string
        4?: string
    }
    talents: [number, number, number]
}

interface Weapon {
    _id: string
    id: string
    name: string
    level: number
    refinement: number
    equipped: string
    rarity: number
    type: string
}

interface Artifact {
    _id: string
    type: number
    level: number
    main: number
    sub1: number
    sub2: number
    sub3: number
    sub4: number
    value1: number
    value2: number
    value3: number
    value4: number
    equipped: string
    set: number
}

interface WishHistory {
    _id: string
    banner: number
    name: string
    rarity: number
    pity: number
    date: Date
}
