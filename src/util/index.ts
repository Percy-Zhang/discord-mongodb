import ValidatePaginateQuery from "./validatePaginateQuery";
import { validateToken } from "./validateToken";
import { getBanner } from "./getBanner";
import { verifyDb } from "./verifyDb";
import { connectToDB } from "./mongodb";
import { generateUUID } from "./generateUUID";
import { generateArtifact } from "./generateArtifact";
import { incArtiSubstat } from "./increaseArtiSubstat";
import { getMainStatValue } from "./getArtifactTotalSubstats";
import { getArtifactTotalStats } from "./getArtifactTotalSubstats";
import { getCharStats } from "./getCharStats";

export const utils = {
    ValidatePaginateQuery,
    validateToken,
    verifyBanner: getBanner,
    verifyDb,
    connectToDB,
    generateUUID,
    generateArtifact,
    incArtiSubstat,
    getMainStatValue,
    getArtifactTotalStats,
    getCharStats,
};
