import { Tokens, tokenize as tokenizeIn } from './script-tokens'
import { Diff } from './storage'
import History from './history'


const DELETE = 'delete'
const MODIFY = 'modify'
const ADD = 'add'


const capitalizeTypes = ['character', 'scene_heading', 'transition']
const removeTokens = ['dialogue_end', 'dialogue_begin']

const prepareTokensRender = (tokens: Tokens[]) => {
    return tokens.filter((token: Tokens) => !removeTokens.includes(token.type))
}

const tokenize = (text: string, options: any) => {
    const newTokens: Tokens[] | [] = tokenizeIn(text, options)

    return prepareTokensRender(newTokens)
}

const getId = () => (Math.random() + 1).toString(36).substring(7);

function combineText(text1 = '', text2 = '', offset1: number, offset2: number) {
    return text1.slice(0, offset1 || text1.length) + text2.slice(offset2 || 0, text2.length)
}

const transformText = (text: string, type: string) => {
    if (capitalizeTypes.includes(type)) return [text.toUpperCase(), true]
    return [text, false]
}

type commitCallbackType = ((tokens: Tokens[], caretPosition: number | null, currentId: number | null) => void) | null


/**
 * NB:
 * you can reset the db with 
 * window.resetDb()
 * 
 * you can see the diffs in the db with 
 * window.diffs().then(diffs => console.log(diffs))
 * 
 * DOCS:
 * 
 * Script history handles changes to the document data.
 * Updates are saved as a Diff and stored in a db.
 * 
 * This enables undo and redo functionality.
 * 
 * The updates are tied to a db script version. 
 * This is so that all diffs are applied to the same version.
 * 
 * NOTES ON FUNCTIONALITY:
 * 
 * When an update to the doc is made, the Diff goes into the pendingUpdates queue.
 * on calling "commit" the diffs are saved to the db. "commit" in this case is how the ScriptHistory
 * interacts with React state, or an external representation of the tokens.
 * 
 * The Diffs have a group id, as there may be serveral individual updates during a document change 
 * (deleting a row and adding text) before a commit that represent a single update from the users perspective.
 * 
 * -- ON UNDO
 * On ctrl+z or Meta+z (undo) we get the last group of changes and apply them. Once applied, this 
 * group (the array of Diffs represting a chagnge) is pushed to the pendingRedos queue (which is an array of arrays). 
 * 
 * -- ON REDO
 * If the user "redoes" (shift+ctrl+z or shift+Meta+z) we pull from the pendingRedos queue and apply the redos.
 * 
 * -- ON NEW CHANGES
 * If the user makes new changes while there are pendingRedos, the pending redos are transformed into new
 * Diffs and added to the db. This way the "undos" become apart of the history. 
 * 
 * 
 * TESTS
 * 
 * 1) 
 * - Highlight sevearl lines
 * - delete lines
 * - undo 
 * 
 * 2)
 * - highlight lines, ctrl+c
 * - ctrl+v
 * 
 * should copy lines and paste them
 * caret should be at end of line
 * 
 * 3)
 * - highlight lines, ctrl+c
 * - mouse paste
 * 
 * 4)
 * - highlight lines, ctrl+c
 * - find a location in the doc
 * - write some text
 * - paste
 * - undo
 * 
 * should undo in the correct order
 * 
 * 5)
 * - got to middle of line
 * - press enter
 * 
 * line should be slplit
 * 
 * - undo
 * 
 * should undo correct
 * 
 * - write new text
 * 
 * 
 */
export class ScriptHistory extends History {
    commitCallback: commitCallbackType = null
    tokens: Tokens[] = []

    constructor(dbTokenVersion: string, db, commitCallback: commitCallbackType, tokens: Tokens[]) {
        super(dbTokenVersion, db)
        this.setCallbackValues(dbTokenVersion, db, commitCallback, tokens)
    }

    async setCallbackValues(dbTokenVersion: string, db, commitCallback: commitCallbackType, tokens: Tokens[]) {
        const commitUpdateCallback = (lastToUpdate: Diff) => {
            this.commitCallback && this.commitCallback(this.tokens, lastToUpdate?.caretPosition)
        }
        
        const commitUndoCallback = (lastPending: Diff) => {
            this.commitCallback && this.commitCallback(this.tokens, lastPending.caretPosition, lastPending.idxRange || lastPending.idx)
        }

        super.setData(dbTokenVersion, db, commitUpdateCallback, commitUndoCallback)
        this.dbTokenVersion = dbTokenVersion
        this.db = db
        this.commitCallback = commitCallback
        this.tokens = tokens

        if (commitCallback && tokens) {
            await this.applyChanges()
            this.commitCallback(this.tokens)
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

        if (!currentOrderId || !this.tokens[currentOrderId]) return [ currentOffset || 0, currentOrderId]
    
        const nextText = this.tokens[nextId].text || ''
        const carotPostiion = this.tokens[currentOrderId].text?.length || 0 
        const currentText = this.tokens[currentOrderId].text

        this.deleteRange(currentOrderId, nextId, currentOffset || carotPostiion)

        const textCombined = combineText(currentText, nextText, currentOffset, nextOffset)

        const isLastCharacter =  this.tokens[currentOrderId - 1] ? this.tokens[currentOrderId - 1]?.type === 'character' : false
        const foundTokens = tokenize(textCombined, { isLastCharacter })

            foundTokens.forEach((token, foundIdx) => {
                const toAdd = {
                    ...token,
                    id: getId()
                }

                // the line has been removed
                if (currentOffset === 0) {
                    toAdd.text = ''
                }

                this.add(toAdd, currentOrderId + foundIdx, currentOffset || carotPostiion)
            })
    
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
                text: currentText.slice(0, anchorOffset),
            }, Number(currentOrderId), anchorOffset)
        }
        
        const offset = anchorOffset === 0 ? 0 : 1
    
        this.add({
            text,
            caretPosition: anchorOffset,
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

    updateText(tokenPartialMaybe, idxIn: number, caretPosition: number) {
        console.log('idxIn', idxIn)
        const idx = Number(idxIn)

        const lastToken = this.tokens[Math.max(idx - 1, 0)]
        const token = this.tokens[idx]
        if (!token) return

        const isLastCharacter = lastToken?.type === 'character'

        let nextText = null
        // combine text if text was pasted into the middle of text
        if (!token.text) {
            nextText = tokenPartialMaybe.text
        } else {
            nextText = token.text.substring(0, caretPosition || 0) + tokenPartialMaybe.text + token.text.substring(caretPosition || 0, token?.text.length || 0)
        }

        const foundTokens = tokenize(nextText, { isLastCharacter })
        const [newText, didUpdate] = transformText(tokenPartialMaybe.text, token.type)

        let textTransformed = false
        let tokensUpdated = didUpdate

        let focusId = idx
        let nextCaretPostion = caretPosition

        if (foundTokens.length === 1) {
            // Modify if needed
            const foundType = foundTokens[0]?.type
            if (foundType !== token.type) {
                textTransformed = true
            }
            this.modify({
                type: foundTokens[0]?.type,
                text: newText
            }, idx, caretPosition)
        } else {
            // Remove current and add new items 
            textTransformed = true
            this.deleteRange(idx, idx, caretPosition)
            foundTokens.reverse().forEach((foundToken, foundIdx) => {
                // not effeicient to reassing on each, but easy .
                focusId = Number(idx) + Number(foundIdx)
                nextCaretPostion = foundToken?.text?.length
                this.add(foundToken, focusId, caretPosition)
            })

        }

        return [tokensUpdated || textTransformed, focusId, nextCaretPostion]
    }

    /**
     * 
     * @param startIdx 
     * @param endIdx 
     * @param caretPosition 
     * 
     * startIdx and endIdx are inclusive. delete startIdx up to and including endIdx
     */
    deleteRange(startIdx: number, endIdx: number, caretPosition: number) {
        if (startIdx > endIdx) {
            throw 'Start index cannot be grater than end index';
        }

        this.change({
            type: DELETE,
            caretPosition,
            idx: startIdx,
            idxRange: endIdx,
            // endIdx + 1 becuase we want to include that index
            oldValue: this.tokens.slice(startIdx, endIdx + 1).map(obj => ({ ...obj })),
        })
    }


    add(token: Tokens, idx: number, caretPosition: number) {
        this.change({
            caretPosition,
            idx: idx,
            type: ADD,
            newValue: token,
        })
    }
    
    modify(tokenPartialMaybe, idx: number, caretPosition: number) {
        this.change({
            caretPosition,
            idx: idx,
            type: MODIFY,
            oldValue: {...this.tokens[idx]},
            newValue: tokenPartialMaybe,
        })
    }

    deleteInternal({ idx, idxRange }: Diff) {
        try {
            // deleteInternal is used for deleting and addUndo.  (idxRange - idx) + 1) is for the initial delete,
            // but for addUndo we only need to delete one item and it and an ADD update does not have an idxRange
            // TODO add testing for this
            const forHowMany = idxRange ? ((idxRange - idx) + 1) : 1 
            this.tokens = this.tokens.toSpliced(idx, forHowMany)
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


    addDo(update: Diff) {
        try {
            this.tokens = this.tokens.toSpliced(update.idx, 0, update.newValue)
        } catch (e) {
            console.error('Error adding', e)
        }
    }


    deleteRangeDo(update: Diff) {
        return this.deleteInternal(update)
    }
    
    
    modifyDo(update: Diff) {
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
            this.tokens = this.tokens.toSpliced(updates.idx, 0, ...(Array.isArray(updates.oldValue) ? updates.oldValue : [updates.oldValue]))
        } catch (e) {
            console.error('Error adding', e)
        }
    }

    redo() {
        const lastApplied = super.redo()
        if (!lastApplied) return
        this.commitCallback && this.commitCallback(this.tokens, lastApplied?.caretPosition, lastApplied.idx)
    }

    async diffs() {
        const res = await this.db.diffs(this.dbTokenVersion)
        return res
    }

}