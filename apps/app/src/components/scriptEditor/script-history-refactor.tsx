import { Tokens, TokenType, tokenize as tokenizeIn } from './script-tokens'
import { Diff } from './storage'
import History, { updateTypes, ChangeType } from './history'
import { getWindow } from '@/getWindow'
import { v4 as uuid } from 'uuid';

let window = getWindow()




const DELETE = 'delete'
const MODIFY = 'modify'
const ADD = 'add'


const capitalizeTypes = ['character', 'scene_heading', 'transition']
const removeTokens = ['dialogue_end', 'dialogue_begin']

const prepareTokensRender = (tokens: Tokens[]) => {
    return tokens?.filter((token: Tokens) => !removeTokens.includes(token.type))
}

const tokenize = (text: string, options: any) => {
    const newTokens: Tokens[] | [] = tokenizeIn(text, options)

    return prepareTokensRender(newTokens)
}

const idSet = new Set()
const getId = () => {
    const id  = uuid()
    if (idSet.has(id)) return getId()
    idSet.add(id)
    return id
};

function combineText(text1 = '', text2 = '', offset1: number, offset2: number) {
    return text1.slice(0, offset1 || text1.length) + text2.slice(offset2 || 0, text2.length)
}

const transformText = (text: string, type: string) => {
    if (capitalizeTypes.includes(type)) return [text.toUpperCase(), true]
    return [text, false]
}

type Character = { name: string, gender: string | null, id: string }

type LineId = string;

type commitCallbackType = ((tokens: Tokens[], caretPosition: number | null, currentId: number | null) => void) | null
type setCharactersType = ((characters: Character[] | []) => void) | null

type saveStatus = 'clean' | 'dirty'

class Line {
    line: Tokens = null
    scriptMeta = null
    constructor(line, scriptMeta) {
        this.scriptMeta = scriptMeta
        this.line = line
        this.update(line)
        this.#updateType(line.type)
    }

    get id() {
        return this.line.id
    }

    get type() {
        return this.line.type
    }

    get text() {
        return this.line.text
    }
    set character_id(id) {
        return this.line.character_id = id
    }

    #updateType(newType) {
        this.scriptMeta.removeLineFromType(this)
        this.scriptMeta.addLineToType(newType, this)
    }

    update(line) {
        if (line.type !== this.line?.type) this.#updateType(line.type)
        this.line = line  

        if (this.line.type === "action" && !this.line.character_id) {
            this.line.character_id = this.scriptMeta.charactersNames?.Narrator?.id
            this.line.isDialog = true
        }
        
        if (this.line.character_id && !this.line.isDialog && this.line.type !== 'character') {
            this.line.isDialog = true
        }

    }
}

class ScriptMeta {
    charactersNames: {[key: string]: Character} = {}
    characters: Character[] = [] // existing characters from the remote db
    linesById: {[key: LineId]: Line} = {}
    linesByType: {[key: TokenType]: {[key: LineId]: Tokens} } = {}
    saveStatus: saveStatus = 'clean'

    constructor(characters: Character[] | null, lines: Tokens[] | null) {
        this.addCharacters(characters)
        this.addExistingLines(lines)
        window.scriptMeta = this
    }

    setClean() {
        this.saveStatus = 'clean'
    }
    
    setDirty() {
        this.saveStatus = 'dirty'
    }

    get isDirty() {
        return this.saveStatus === 'dirty'
    }

    get isClean() {
        return this.saveStatus === 'clean'
    }

    get saveStaus () {
        return this.saveStatus
    }

    createNarrator() {
        const name = 'Narrator'
        this.charactersNames[name] = {
            id: getId(),
            name,
            gender: null,
        } 
    }

    addCharacters(characters: Character[]) {
        if (!characters) return
        this.characters = characters
        for (const character of characters) {
            this.charactersNames[character.name] = character
        }
    }

    addExistingLines(lines) {
        if (!lines) return;

        this.onLineChage(lines, ADD)
    }

    getCharacters() {
        this.updateCharacterNameMap()
        return Object.values(this.charactersNames)
    }
 
    getNewCharacters() {
        // TODO this also needs to handle removing characters
        const names = new Set(this.characters?.map(character => character.name))
        return this.getCharacters()?.filter(character => !names.has(character.name))
    }


    updateCharacterNameMap() {
        const exclude = ['written']
        try {
            const names = new Set(Object.keys(this.charactersNames))

            for (const lineId in this.linesByType?.character) {

                const { text } = this.linesById[lineId] || {}

                if (!text) continue
                const textLower = text.toLocaleLowerCase()
                if (exclude.some(excludeName => textLower.startsWith(excludeName))) continue
                // discard paraens
                const name = text.endsWith(')') ? text.replace(/\(.+\)/g, '')?.trim() : text
                names.delete(name)

                if (this.charactersNames[name]) {
                    this.linesById[lineId].character_id = this.charactersNames[name].id
                    continue
                }
                const id = getId()
                this.charactersNames[name] = {
                    id,
                    name,
                    gender: null,
                }  

                this.linesById[lineId].character_id = id
            }


            for (const name of names) {
                if (name.toLocaleLowerCase() === "narrator") continue
                delete this.charactersNames[name]
            }

        } catch(e) {
            console.log("updateCharacterNameMap", e)

        }
    }

    removeLineFromType(line: Line) {
        const type = this.linesById[line.id]?.type

        if (!type || !this.linesByType[type]) return

        delete this.linesByType[type][line.id]

    }
    
    addLineToType(type, line: Line) {

        if (!this.linesByType[type]) {
            this.linesByType[type] = {}
        }

        this.linesByType[type][line.id] = line

    }
    
    onLineChage(changes, updateType) {
        for (const change of changes) {
            switch(updateType) {
                case ADD:   
                    this.linesById[change.id] = new Line(change, this)
                break;
                case MODIFY:
                    const line = this.linesById[change.id]
                    if (line) {
                        line.update(change)
                    }
                    // this.linesById[change.id] = change
                break;
                case DELETE:
                   delete this.linesById[change.id]
                break;
            }
        }

    }
}

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
    appliedVersion: string = ''
    charactersNameMap: { [key: string]: Character} = {}
    characterLines: {[key: string]: Character} = {}
    scriptMeta = null

    setCharacters: setCharactersType = null

    constructor(dbTokenVersion: string, db, commitCallback: commitCallbackType, tokens: Tokens[] | null, setCharacters: setCharactersType, characters: Character[]) {
        
        super(dbTokenVersion, db)
        // TODO pass all tokens into script meta at some point
        this.setCallbackValues(dbTokenVersion, db, commitCallback, tokens, setCharacters, characters)
    }

    async setCallbackValues(dbTokenVersion: string, db, commitCallback: commitCallbackType, tokens: Tokens[] | null, setCharacters: setCharactersType, characters: Character[]) {
        this.scriptMeta = this.scriptMeta ? this.scriptMeta : new ScriptMeta()
        this.scriptMeta.addExistingLines(tokens)
        this.scriptMeta.addCharacters(characters)

        const commitUpdateCallback = (lastToUpdate: Diff | undefined) => {
            this.commitCallback && this.commitCallback(this.tokens, lastToUpdate?.caretPosition)
        }
        
        const commitUndoCallback = (lastPending: Diff) => {
            this.commitCallback && this.commitCallback(this.tokens, lastPending.caretPosition, lastPending.idxRange || lastPending.idx)
        }

        super.setData(dbTokenVersion, db, commitUpdateCallback, commitUndoCallback)
        this.dbTokenVersion = dbTokenVersion
        this.db = db
        this.commitCallback = commitCallback
        this.tokens = tokens && tokens.length ? tokens : [this.getEditNode()]

      
        this.setCharacters = setCharacters

        tokens?.forEach(token => idSet.add(token.id))

        if (commitCallback && tokens && this.appliedVersion !== dbTokenVersion) {

            // this is so that we don't re-apply changes if setCallbackValues is called multiple times
            this.appliedVersion = dbTokenVersion
            await this.applyChanges()
            this.commitCallback(this.tokens)
            this.commitCharacters()
        } else if (commitCallback) {
            commitCallback && commitCallback(this.tokens)
        }

        window.resetDb = async () => {
            await db?.resetDb()
            window.location.reload()
        }
        window.undo = this.undo.bind(this)
        window.redo = this.redo.bind(this)
        window.diffs = () => db?.diffs(dbTokenVersion)
        window.setVersion = this.setVersion.bind(this)
        window.getNewCharacters = this.getNewCharacters.bind(this)
        window.getCharacters = this.getCharacters.bind(this)
    }

    async applyChanges() {

        if (!this.dbTokenVersion) return
        const diffs = await this.diffs(this.dbTokenVersion);

        const diffsToApply = !this.lastInsertedId ? diffs : diffs.filter((update: Diff) => update.id > this.lastInsertedId)
        if (!diffs || !diffs.length) return

        const last = diffs[diffs.length - 1]
        this.lastInsertedId = last.id

        super.applyDo(diffs)
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


        if (!currentOrderId && currentOrderId !== 0 || !this.tokens[currentOrderId]) return [ currentOffset || 0, currentOrderId]
    
        const nextText = this.tokens[nextId].text || ''
        const carotPostiion = this.tokens[currentOrderId].text?.length || 0 
        const currentText = this.tokens[currentOrderId].text

        this.deleteRange(currentOrderId, nextId, currentOffset || carotPostiion)

        const textCombined = combineText(currentText, nextText, currentOffset, nextOffset)
        const lastToken = this.tokens[currentOrderId - 1]
        const isLastCharacter =  lastToken ? lastToken?.type === 'character' : false
        const characterNameMaybe = isLastCharacter ? lastToken?.character_id : this.scriptMeta.charactersNames?.Narrator?.id
        const foundTokens = tokenize(textCombined, { isLastCharacter, characterNameMaybe })

            foundTokens.forEach((token, foundIdx) => {
                const toAdd = {
                    ...token,
                    id: getId()
                }

                if (toAdd.type === 'action' && !toAdd.character_id) {
                    toAdd.character_id = characterNameMaybe
                }

                // the line has been removed
                if (currentOffset === 0) {
                    toAdd.text = ''
                }

                this.add(toAdd, currentOrderId + foundIdx, currentOffset || carotPostiion)
            })
    
        // console.log('this.pendingUpdates', this.pendingUpdates)
        return [currentOffset || carotPostiion, currentOrderId]
    }

    getEditNode(text = '', anchorOffset = 0) {
        return {
            text,
            caretPosition: anchorOffset,
            type: 'editNode',
            character_id: null,
            id: getId()
        }
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
    
        const update = this.getEditNode(text, anchorOffset)

        if (update.type === "action" && !update.character_id) {
            update.character_id = this.scriptMeta.charactersNames?.Narrator?.id
            update.isDialog = true
        }

        this.add(update, Number(currentOrderId) + offset)
    
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
        const idx = Number(idxIn)
        if (!this.tokens) []

        const lastToken = this.tokens[Math.max(idx - 1, 0)]
        const token = this.tokens[idx]
        if (!token) []

        // console.log('lastToken', lastToken)
        // console.log('token', token)
        const isLastCharacter = lastToken?.type === 'character'
        const characterNameMaybe = isLastCharacter ? lastToken?.character_id : this.scriptMeta.charactersNames?.Narrator?.id

        let nextText = null
        // combine text if text was pasted into the middle of text
        if (!token?.text) {
            nextText = tokenPartialMaybe.text
        } else {
            if (tokenPartialMaybe.text) {
                nextText = token.text.substring(0, caretPosition || 0) + tokenPartialMaybe.text + token.text.substring(caretPosition || 0, token?.text.length || 0)
            } else {
                nextText = token.text
            }
        }

        const foundTokens = tokenize(nextText, { isLastCharacter, characterNameMaybe }, this.setCharacters)
        const [newText, didUpdate] = transformText(tokenPartialMaybe.text, token?.type)
        
        if (!didUpdate && this.tokens[idx]) {
            this.tokens[idx].text = newText
        }

        let textTransformed = false
        let tokensUpdated = didUpdate

        let focusId = idx
        let nextCaretPostion = caretPosition

        if (foundTokens.length === 1) {
            // Modify if needed
            const foundType = foundTokens[0]?.type
            if (foundType !== token?.type) {
                textTransformed = true
            }
            console.log('modify--')
            const update = {
                type: foundTokens[0]?.type,
                character_id: foundTokens[0]?.character_id,
                isDialog: foundTokens[0]?.isDialog,
                text: newText
            }

            if (update.type === "action" && !update.character_id) {
                update.character_id = characterNameMaybe
                update.isDialog = true
            }

            this.modify(update, idx, caretPosition)

        } else {
            // Remove current and add new items 
            textTransformed = true
            this.deleteRange(idx, idx, caretPosition)
            foundTokens.reverse().forEach((foundToken, foundIdx) => {
                // not effeicient to reassing on each, but easy .
                focusId = Number(idx) + Number(foundIdx)
                nextCaretPostion = foundToken?.text?.length
                if (!foundToken.id) {
                    foundToken.id = getId()
                }

                this.add(foundToken, focusId, caretPosition)
            })
        }

        const updated = tokensUpdated || textTransformed
        return [updated, focusId, nextCaretPostion]
    }

    onTab(orderId, offset) {

        const token = this.tokens[orderId]
        const lastToken = this.tokens[orderId - 1]

        if (!token.text && lastToken?.type !== 'character') {
            this.modify({
                type: 'character',
            }, orderId, offset)
            return
        }

        if (lastToken?.type === 'character') {
            this.modify({
                type: 'dialogue',
                character_id: lastToken.character_id,
                isDialog: true,
            }, orderId, offset)
        }
    }


    onTokenChange(changesIn, type) {
        const changes = Array.isArray(changesIn) ? changesIn : [changesIn]

        this.scriptMeta.onLineChage(changes, type)
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
        // console.log('deleteInternal', idx, idxRange)
        try {
            // deleteInternal is used for deleting and addUndo.  (idxRange - idx) + 1) is for the initial delete,
            // but for addUndo we only need to delete one item and it and an ADD update does not have an idxRange
            // TODO add testing for this
            const forHowMany = idxRange ? ((idxRange - idx) + 1) : 1 

            
            this.onTokenChange(this.tokens.slice(idx, idx + forHowMany + 1), DELETE)
            this.tokens = this.tokens.toSpliced(idx, forHowMany)
        } catch (e) {
            // console.error('Error deleting', e)
        }
    }

    modifyInternal(udpate: Diff, isForward: boolean = true) {
        // console.log('isForward', isForward, udpate, this.tokens)
        const updateValue = isForward ? udpate.newValue : udpate.oldValue
        // console.log("tbefore his.tokens[udpate.idx]", this.tokens[udpate.idx])
        this.tokens[udpate.idx] = {...this.tokens[udpate.idx]}
        // console.log("after this.tokens[udpate.idx]", this.tokens[udpate.idx])


        try {
            for (const [key, value] of Object.entries(updateValue)) {
                if (key === 'id') continue
                this.tokens[udpate.idx][key] = value
            }
        } catch (e) {
            console.error('Error modifying', e)
        }

        this.onTokenChange(this.tokens[udpate.idx], MODIFY)

        this.tokens = [...this.tokens]

        // console.log("this.tokens", this.tokens)
    }


    addDo(update: Diff) {
        // console.log("addDo", update)
        try {

            const changes = (Array.isArray(update.newValue) ? update.newValue : [update.newValue])
            this.onTokenChange(changes, ADD)
            this.tokens = this.tokens.toSpliced(update.idx, 0, ...changes)

        } catch (e) {
            // console.error('Error adding', e)
        }
    }


    deleteRangeDo(update: Diff) {
        // console.log("deleteRangeDo", this.tokens)
        return this.deleteInternal(update)
    }
    
    
    modifyDo(update: Diff) {
        return this.modifyInternal(update)
    }

    addUndo(update: Diff) {
        // console.log("addUndo", update, this.tokens)
        return this.deleteInternal(update)
    }
    
    modifyInternalUndo(update: Diff) {

        return this.modifyInternal(update, false)
    }

    deleteRangeUndo(updates: Diff) {
        try {
            this.tokens = this.tokens.toSpliced(updates.idx, 0, ...(Array.isArray(updates.oldValue) ? updates.oldValue : [updates.oldValue]))
        } catch (e) {
            // console.error('Error adding', e)
        }
    }

    redo() {
        const lastApplied = super.redo()
        if (!lastApplied) return
        this.commitCallback && this.commitCallback(this.tokens, lastApplied?.caretPosition, lastApplied.idx)
    }

    commitCharacters() {
        this.scriptMeta.updateCharacterNameMap()

        if (this.setCharacters) {
            this.setCharacters(this.scriptMeta.getNewCharacters())
        }
    }

    commit(options = {}) {
        const addedModifed = this.pendingUpdates
            .filter(update => update?.newValue?.type === 'character' || update?.oldValue?.type === 'character')
        
        if (options?.updateCharacters) {
         this.commitCharacters()
        }
        super.commit(options)
    }

    async diffs() {
        const res = await this.db.diffs(this.dbTokenVersion)
        return res
    }

    getNewCharacters() {
        return this.scriptMeta.getNewCharacters()
    }
    
    getCharacters() {
        return this.scriptMeta.getCharacters()
    }

    get saveStatus () {
        return this.scriptMeta.saveStaus
    }

    setClean() {
        this.scriptMeta.setClean()
    }
    
    setDirty() {
        this.scriptMeta.setDirty()
    }
    
    get isDirty() {
        return this.scriptMeta.isDirty
    }

    get isClean() {
        return this.scriptMeta.isClean
    }

}