export const removeTypename = <T>(value: T): T => {
    if (Array.isArray(value)) {
        return value.map(removeTypename) as T;
    }

    if (value !== null && typeof value === "object") {
        const newObj: any = {};
        for (const key in value) {
            if (key !== "__typename") {
                newObj[key] = removeTypename((value as any)[key]);
            }
        }
        return newObj;
    }

    return value;
};
