// db.ts
import Dexie, { type EntityTable } from 'dexie';

export type Diff = {
  id: number;
  idx: number;
  idxRange?: number; // if there is a range for delets
  group: string; // if several diffs are made at once and we want to apply together
  type: 'add' | 'delete' | 'modify';
  oldValue: object;
  newValue?: object;
  remoteDBVersion: number;
}

const db = new Dexie('FriendsDatabase') as Dexie & {
  diff: EntityTable<
    Diff,
    'id' // primary key "id" (for the typings only)
  >;
};

// Schema declaration:
db.version(1).stores({
  diff: '++id, idx, idxRange, group, type, oldValue, newValue, remoteDBVersion' // primary key "id" (for the runtime!)
});


export function diffs(version: string) {
    return db.diff.where('remoteDBVersion').equals(version)
    .toArray();
}


export function add(diffObj: Diff) {
    db.diff.add(diffObj)
}

export function getById(id: number) {
    console.log("id", id)
    // return db.diff.where('id').equals(id)
    return db.diff.get(id)
}

export function getByGroupId(id: number) {
    console.log("id", id)
    return db.diff.where('group').equals(id).toArray();
}

export async function getByIdGroup(id: number) {
    console.log("id", id)
    const last = await db.diff.get(id)
    if (!last) return []
    
    return db.diff.where('group').equals(last.group).toArray();
}

export async function bulkAdd(diffObj: Diff[]) {
    return db.diff.bulkAdd(diffObj)
}

export function resetDb() {
   db.delete();
}

export function createDiff(newArr, OldArr = []) {
    for (const idx in newArr) {
        const item = newArr[idx]

    }
}

export type { Friend };
export { db };