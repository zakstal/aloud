import { Diff } from './storage'

const DELETE = 'delete'
const MODIFY = 'modify'
const ADD = 'add'

export const updateTypes = {
    DELETE,
    MODIFY,
    ADD,
}

type UpdateType = 'delete' | 'modify' | 'add'

const getId = () => (Math.random() + 1).toString(36).substring(7);

function last(arr: any) {
    return arr[arr.length - 1]
}

let wait = (time) => new Promise((resolve) => setTimeout(() => (resolve()), time))

type commitChangeCallbackType = ((noUpdate: boolean) => void) | null


export type ChangeType = { 
    type: UpdateType, 
    oldValue?: any | null, 
    newValue?: any | null, 
    idx: number, 
    idxRange?: number | null, 
    caretPosition?: number | null
}

/**
 * Implements history for undoing and redoing changes to data.
 * 
 * TODO:
 * - refactor db diffs so that generic values are stored rather than value specific to the script editor
 */
export default class History {
    pendingUpdates: Diff[] = []
    pendingUndos: Diff[] = []
    pendingRedos: Diff[][] = []
    dbTokenVersion: string | null = null
    lastInsertedId: number | null = null
    commitUpdateCallback: commitChangeCallbackType | undefined = null
    commitUndoCallback: commitChangeCallbackType | undefined = null

    constructor(dbTokenVersion: string, db, commitUpdateCallback?: commitChangeCallbackType, commitUndoCallback?: commitChangeCallbackType) {
        this.setData(dbTokenVersion, db, commitUpdateCallback, commitUndoCallback)
        window.calls = []
        window.appliedIds = []
    }

    setData(dbTokenVersion: string, db, commitUpdateCallback?: commitChangeCallbackType, commitUndoCallback?: commitChangeCallbackType) {
        this.dbTokenVersion = dbTokenVersion
        this.db = db
        this.commitUpdateCallback = commitUpdateCallback
        this.commitUndoCallback = commitUndoCallback
    }

    async setVersion(dbTokenVersion, direction: 'start' | 'end' = 'end') {
        if (this.pendingUpdates) {
            await this.commitUpdates()
        }
        this.flushUpdates()
        this.flushUndos()

        this.dbTokenVersion = dbTokenVersion
        if (direction === 'end') {
            this.applyChanges()
            return
        }
        if (direction === 'start') {
            const res = await this.diffs(this.dbTokenVersion)
            this.pendingUndos = res
            return
        }

    }



    // could be run on setData
    async applyChanges() {
        if (!this.dbTokenVersion) return
        const diffs = await this.diffs(this.dbTokenVersion);

        const diffsToApply = !this.lastInsertedId ? diffs : diffs.filter((update: Diff) => update.id > this.lastInsertedId)
        if (!diffs || !diffs.length) return

        const last = diffs[diffs.length - 1]
        this.lastInsertedId = last.id

        // console.log("redo applyChanges")
        this.applyDo(diffsToApply)
    }


    change({ type, oldValue, newValue, idx, idxRange, caretPosition }: ChangeType) {
        this.pendingUpdates.push({
            caretPosition,
            idx,
            idxRange,
            type,
            oldValue,
            newValue,
            remoteDBVersion: this.dbTokenVersion,
        })
    }


    deleteRangeDo(update: Diff) {}
    
    modifyDo(update: Diff) {}

    addDo(update: Diff) {}

    addUndo(update: Diff) {}
    
    modifyInternalUndo(update: Diff) {}

    deleteRangeUndo(updates: Diff) {}

    applyDo(updates: Diff[]) {
        for (const update of updates) {
            switch(update.type) {
                case DELETE:
                    this.deleteRangeDo(update)
                break;
                case ADD:
                    this.addDo(update)
                break;
                case MODIFY:
                    this.modifyDo(update)
                break;

            }
        }
    }
    
    applyUndo(update: Diff[] | Diff) {
        let updates: Diff[] = !Array.isArray(update) ? [update] : update
        // its important that these run in reverse order becuase, as we delcare deletions, additions and modifications
        // in the code, we want those to be applied in the order we delcare them.
        for (let i = updates.length - 1; i >= 0; i--) {
            const update = updates[i]
            if (!update) continue
            switch(update.type) {
                case DELETE:
                    this.deleteRangeUndo(update)
                break;
                case ADD:
                    this.addUndo(update)
                break;
                case MODIFY:
                    this.modifyInternalUndo(update)
                break;

            }
        }
    }

    transformDiffToUpdate(update: Diff) {
        let oldValue = null
        let newValue = null
        const { id, ...diff} = update

        switch(diff.type) {
            case DELETE:
                oldValue = diff.oldValue
                newValue = diff.newValue
                return {
                    ...diff,
                    type: ADD,
                    oldValue: newValue,
                    newValue: oldValue
                }

            case ADD:
                oldValue = diff.oldValue
                newValue = diff.newValue
                return {
                    ...diff,
                    type: DELETE,
                    oldValue: newValue,
                    newValue: oldValue
                }
            case MODIFY:
                oldValue = diff.oldValue
                newValue = diff.newValue
                return {
                    ...diff,
                    oldValue: newValue,
                    newValue: oldValue
                }
            }
    }

    async undo() {
        if (this.pendingUpdates) {
            await this.commitUpdates()
        }
        if (!this.lastInsertedId && this.lastInsertedId !== 0) {
            const res = await this.diffs(this.dbTokenVersion)
            if (!res || !res.length) return

            const last = res[res.length - 1]
            this.lastInsertedId = last.id
        }

        if (!this.lastInsertedId) return

        const lastInstertedGroup = await this.db.getByIdGroup(this.lastInsertedId, this.dbTokenVersion)


        if (!lastInstertedGroup || !lastInstertedGroup.length) return
        const last = lastInstertedGroup.sort((a: Diff, b: Diff) => Number(a.id) - Number(b.id))[0]
        const nextLastInsertedId = Number(last.id) - 1
        if (this.lastInsertedId === nextLastInsertedId)  return // we are at the end

        this.pendingUndos = this.pendingUndos.concat(lastInstertedGroup)

        // set Id to last undoModification
        // a bit stupid to subtract 1, but the ids are sequential and its easy for now. 
        
        this.lastInsertedId = nextLastInsertedId

        this.commitUndos()

    }

    redo() {
        const nextUndoGroup = this.pendingRedos.pop()
        if (!nextUndoGroup) return;

        this.applyDo(nextUndoGroup)
        const stagedUndoGroup = this.pendingRedos ? this.pendingRedos[this.pendingRedos.length - 1] : null

        // const lastStaged = stagedUndoGroup ? stagedUndoGroup[stagedUndoGroup.length - 1] : null
        const lastStaged = nextUndoGroup ? nextUndoGroup[nextUndoGroup.length - 1] : null
        this.lastInsertedId = lastStaged?.id || null
        const lastApplied = last(nextUndoGroup)
        
        return lastApplied
    }

    async diffs() {
        const res = await this.db.diffs(this.dbTokenVersion)
        return res
    }

    async commitUpdates(noUpdate: boolean = false) {
        if (!this.pendingUpdates.length) return
        const groupId = getId()
        this.pendingUpdates.forEach(obj => obj.group = groupId)

        this.lastInsertedId = await this.db.bulkAdd(this.pendingUpdates)

        const lastToUpdate = last(this.pendingUpdates)

        this.applyDo(this.pendingUpdates)
        this.flushUpdates()

        !noUpdate && this.commitUpdateCallback && this.commitUpdateCallback(lastToUpdate)
        return lastToUpdate
    }

    async commitRedos() {
        if (!this.pendingRedos.length) return
        // if there are pending redos when we start making new changes
        // apply them to history 
        const prepPending = this.pendingRedos
            .flat()
            .sort((a, b) => a.id - b.id)
            .reverse()
            .map(this.transformDiffToUpdate)

        // a simple way to update the group id
        prepPending.forEach(obj => obj.group = obj.group + 1)

        await this.db.bulkAdd(prepPending)
    }

    async commitUndos(noUpdate: boolean = false) {
        if (!this.pendingUndos.length) return
            const lastPending = this.pendingUndos[0]
            
            this.applyUndo(this.pendingUndos)
            this.flushUndos()

            !noUpdate && this.commitUndoCallback && this.commitUndoCallback(lastPending)
            return lastPending
    }

    /**
     * 
     * @param param0 
     * 
     * NB:
     * On update all pendingUpdates and pendingRedos are cleared.
     * On applying undos, pendingUdos are cleared and added to pendingRedos.
     * 
     */
    async commit({ noUpdate = false, applyPending = true, applyUndo = true, applyRedos = true } = {}) {

        if (applyRedos) {
           this.commitRedos()
        } 

        if (applyPending) {
            this.commitUpdates(noUpdate)
        }
        
        if (applyUndo) {
          this.commitUndos(noUpdate)
        }

    }

    flushUpdates() {
        this.pendingUpdates = []
        this.pendingRedos = []
    }

    flushUndos() {
        this.pendingRedos.push(this.pendingUndos) // array of arrays of updates
        this.pendingUndos = []
    }
}