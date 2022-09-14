export default function validatePaginateQuery(page: string | string[], paginate: string | string[]) {
    if (typeof page === "string" && parseInt(page) !== NaN) {
        if (typeof paginate === "string" && parseInt(paginate) !== NaN) {
            return (parseInt(page) - 1) * parseInt(paginate);
        }
    }
    return 0;
}
