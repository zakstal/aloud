import next from 'next'
import { Tokens } from './script-tokens'
import { Diff } from './storage'

const DELETE = 'delete'
const MODIFY = 'modify'
const ADD = 'add'

const getId = () => (Math.random() + 1).toString(36).substring(7);

function combineText(text1 = '', text2 = '', offset1: number, offset2: number) {
    return text1.slice(0, offset1 || text1.length) + text2.slice(offset2 || 0, text2.length)
}

type commitCallbackType = ((tokens: Tokens[]) => void) | null

export class ScriptHistory {
    commitCallback: commitCallbackType = null
    tokens: Tokens[] = []
    pendingUpdates: Diff[] = []
    pendingUndos: Diff[] = []
    pendingRedos: Diff[][] = []
    dbTokenVersion: string | null = null
    lastInsertedId: number | null = null
    db = null

    constructor(dbTokenVersion: string, db, commitCallback: commitCallbackType, tokens: Tokens[]) {
        this.setCallbackValues(dbTokenVersion, db, commitCallback, tokens)
    }

    async applyChanges() {
        const diffs = await this.diffs();
        this.applyForward(diffs)
        this.commitCallback(this.tokens)
    }

    setCallbackValues(dbTokenVersion: string, db, commitCallback: commitCallbackType, tokens: Tokens[]) {
        this.dbTokenVersion = dbTokenVersion
        this.db = db
        this.commitCallback = commitCallback
        this.tokens = tokens

        if (commitCallback && tokens) {
            this.applyChanges()
        }

        window.resetDb = async () => {
            await db?.resetDb()
            window.location.reload()
        }
        window.undo = db?.undo
        window.diffs = () => db?.diffs(dbTokenVersion)
    }

    combineRange(currentOrderIdIn: number, nextIdIn: number, currentOffsetIn: number, nextOffsetIn: number) {
        let currentOrderId = currentOrderIdIn
        let nextId = nextIdIn || currentOrderIdIn - 1
        let currentOffset = currentOffsetIn
        let nextOffset = nextOffsetIn
    
        // make sure currentOrderId is less than nextOrderId 
        if (currentOrderId > nextId) {
            const currentTemp = currentOrderId
            currentOrderId = nextId
            nextId = currentTemp
    
            const currentOffsetTemp = currentOffset
            currentOffset = nextOffset
            nextOffset = currentOffsetTemp
        }

        if (!currentOrderId || !this.tokens[currentOrderId]) return
    
        const nextText = this.tokens[nextId].text || ''
        const carotPostiion = this.tokens[currentOrderId].text?.length || 0 
        const currentText = this.tokens[currentOrderId].text
    
        let currentOrderIdNext = currentOrderId + 1

        let nextIdNext = currentOrderIdNext >= nextId ? currentOrderIdNext + 1 : nextId


        this.deleteRange(currentOrderId + 1, nextIdNext)

        this.modify({
            text: combineText(currentText, nextText, currentOffset, nextOffset)
        }, currentOrderId)
    
        return [currentOffset || carotPostiion, currentOrderId]
    }

    splitRange(currentOrderId: number, anchorOffset: number) {

        const currentToken = this.tokens[Number(currentOrderId)]
        let text = ''
        const currentText = currentToken?.text || ''
        const textLength = currentText?.length || 0
        
        if (textLength > anchorOffset && anchorOffset !== 0) {
            text = currentText.slice(anchorOffset , textLength)

            this.modify({
                text: currentText.slice(0, anchorOffset)
            }, Number(currentOrderId))
        }
        
        const offset = anchorOffset === 0 ? 0 : 1
    
        this.add({
            text,
            type: 'editNode',
            id: getId()
        }, Number(currentOrderId) + offset)
    
    }

    combineSplitRange(currentOrderIdIn: number, currentOffsetIn: number, nextIdIn: number, nextOffsetIn: number) {
        let foucsId = currentOrderIdIn
        let caret = currentOffsetIn 
        if (currentOffsetIn != null && nextOffsetIn != null) {
            const [carotPostiion, currentOrderId] = this.combineRange(currentOrderIdIn, nextIdIn, currentOffsetIn, nextOffsetIn)
            foucsId = currentOrderId
            caret = carotPostiion
        }

        return this.splitRange(foucsId, caret)
    }

    deleteRange(startIdx: number, endIdx: number) {
        if (startIdx > endIdx) {
            throw 'Start index cannot be grater than end index';
        }

        this.pendingUpdates.push({
            type: DELETE,
            idx: startIdx,
            idxRange: endIdx,
            oldValue: this.tokens.slice(startIdx, endIdx).map(obj => ({ ...obj })),
            remoteDBVersion: this.dbTokenVersion,
        })
    }


    add(token: Tokens, idx: number) {
        this.pendingUpdates.push({
            idx: idx,
            type: ADD,
            newValue: token,
            remoteDBVersion: this.dbTokenVersion,
        })
    }
    
    modify(tokenPartialMaybe, idx: number) {
        this.pendingUpdates.push({
            idx: idx,
            type: MODIFY,
            oldValue: {...this.tokens[idx]},
            newValue: tokenPartialMaybe,
            remoteDBVersion: this.dbTokenVersion,
        })
    }

    deleteInternal({ idx, idxRange }: Diff) {
        try {
            this.tokens = this.tokens.toSpliced(idx, idxRange ? (idxRange - idx) : 1 )
        } catch (e) {
            console.error('Error deleting', e)
        }
    }

    modifyInternal(udpate: Diff, isForward: boolean = true) {
        const allowedModificationKeys = ['']
        const updateValue = isForward ? udpate.newValue : udpate.oldValue
        this.tokens[udpate.idx] = {...this.tokens[udpate.idx]}

        try {
            for (const [key, value] of Object.entries(updateValue)) {
                if (key === 'id') continue
                this.tokens[udpate.idx][key] = value
            }
        } catch (e) {
            console.error('Error modifying', e)
        }

        this.tokens = [...this.tokens]
    }


    addInternalForward(update: Diff) {
        console.log('add inter foward update', update)
        try {

            this.tokens = this.tokens.toSpliced(update.idx, 0, update.newValue)
        } catch (e) {
            console.error('Error adding', e)
        }
    }


    deleteInternalForward(update: Diff) {
        return this.deleteInternal(update)
    }
    
    
    modifyInternalFoward(update: Diff) {
        return this.modifyInternal(update)
    }

    addUndo(update: Diff) {
        return this.deleteInternal(update)
    }
    
    modifyInternalUndo(update: Diff) {

        return this.modifyInternal(update, false)
    }

    deleteRangeUndo(updates: Diff) {
        try {
            this.tokens = this.tokens.toSpliced(updates.idx, 0, ...updates.oldValue)
        } catch (e) {
            console.error('Error adding', e)
        }
    }

    applyForward(updates: Diff[]) {
        for (const update of updates) {
            switch(update.type) {
                case DELETE:
                    this.deleteInternalForward(update)
                break;
                case ADD:
                    this.addInternalForward(update)
                break;
                case MODIFY:
                    this.modifyInternalFoward(update)
                break;

            }
        }
    }
    
    applyUndo(update: Diff[] | Diff) {
        let updates: Diff[] = !Array.isArray(update) ? [update] : update

        for (const update of updates) {
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
        console.log("UNDO-----------------")
        if (this.pendingUpdates) {
            await this.commit()
        }
        if (!this.lastInsertedId && this.lastInsertedId !== 0) {
            const res = await this.diffs()
            if (!res || !res.length) return

            const last = res[res.length - 1]
            this.lastInsertedId = last.id
        }

        if (!this.lastInsertedId) return

        const lastInstertedGroup = await this.db.getByIdGroup(this.lastInsertedId)
        if (!lastInstertedGroup || !lastInstertedGroup.length) return

        this.pendingUndos = this.pendingUndos.concat(lastInstertedGroup)

        // set Id to last undoModification
        // a bit stupid to subtract 1, but the ids are sequential and its easy for now. 
        const last = lastInstertedGroup.sort((a: Diff, b: Diff) => Number(a.id) - Number(b.id))[0]
        this.lastInsertedId = Number(last.id) - 1

        this.commit({ applyPending: false })

    }

    redo() {
        console.log("REDO-----------------")
        const nextUndoGroup = this.pendingRedos.pop()
        console.log("nextUndoGroup", nextUndoGroup)
        if (!nextUndoGroup) return;

        this.applyForward(nextUndoGroup)
        const stagedUndoGroup = this.pendingRedos ? this.pendingRedos[this.pendingRedos.length - 1] : null

        const last = stagedUndoGroup ? stagedUndoGroup[stagedUndoGroup.length - 1] : null
        this.lastInsertedId = last?.id || null
        this.commit({ applyUndo: false })
    }

    async diffs() {
        const res = await this.db.diffs(this.dbTokenVersion)
        console.log('res', res)
        return res
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
    async commit({ noUpdate = false, applyPending = true, applyUndo = true } = {}) {
        console.log('this.lastInsertedId-------------', this.lastInsertedId)

        if (this.pendingUpdates.length && applyPending) {
            const groupId = getId()
            this.pendingUpdates.forEach(obj => obj.group = groupId)
            let lastId = null
            let toUpdate: Diff[] | null = null

            if (this.pendingRedos.length) {
                // Reassign the groupId as these are added to the stack as updates
                toUpdate = this.pendingRedos
                .flat()
                .map(this.transformDiffToUpdate)
                .map(redoUpdate => {
                    const groupId = getId()
                    redoUpdate.group = groupId
                    return redoUpdate
                })
                .concat(this.pendingUpdates)

                lastId = await this.db.bulkAdd(toUpdate)
            } else {
                toUpdate = this.pendingUpdates
                lastId = await this.db.bulkAdd(this.pendingUpdates)
            }

            this.lastInsertedId = lastId

            this.applyForward(toUpdate)
            this.flushUpdates()
        }

        console.log("this.pendingUndos.length", this.pendingUndos.length)
        
        if (this.pendingUndos.length && applyUndo) {
            this.applyUndo(this.pendingUndos)
            this.flushUndos()
        }

        if (!noUpdate) {
            this.commitCallback && this.commitCallback(this.tokens)
        }
    }

    flushUpdates() {
        console.log('flush updates')
        this.pendingUpdates = []
        this.pendingRedos = []
    }

    flushUndos() {
        console.log('flush undo')
        this.pendingRedos.push(this.pendingUndos) // array of arrays of updates
        this.pendingUndos = []
    }
}