import { v4 as uuid } from 'uuid';

const idSet = new Set()
export const getId = (): string => {
    const id  = uuid()
    if (idSet.has(id)) return getId()
    idSet.add(id)
    return id
};