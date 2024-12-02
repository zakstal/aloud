import { Tokens, TokenType } from './script-tokens'
import { getWindow } from '@/getWindow'
import { getId } from './utils'

let window = getWindow()

const DELETE = 'delete'
const MODIFY = 'modify'
const ADD = 'add'

type Character = { name: string, gender: string | null, id: string }
type LineId = string;
type saveStatus = 'clean' | 'dirty'
type scriptMetaOptios = {
    onCharacterChange: (characters: Character[]) => void;
}


class Line {
    line: Tokens = {
        character_id: "",
        children: [],
        id: "",
        isDialog: false,
        order: null,
        type: "",
    }
    scriptMeta = null
    constructor(line, scriptMeta) {
        this.scriptMeta = scriptMeta
        for (const key in line) {
            this.line[key] = line[key]
        }
        this.update(line)
        this.#updateType(line.type)
    }

    get id() {
        return this.line.id
    }

    get type() {
        return this.line.type
    }

    get children() {
        return this.line.children
    }
    
    get text() {
        return this.line.children && this.line.children.length ? this.line.children[0]?.text : null
    }

    set character_id(id) {
        return this.line.character_id = id
    }

    #updateType(newType) {

        this.scriptMeta.removeLineFromType(this)
        this.scriptMeta.addLineToType(newType, this)
    }

    getLine() {
        const line = this.line
        return { type: line.type,
            id: line.id,
            isDialog: Boolean(line.isDialog),
            character_id: line.character_id || '',
            order: line.order,
            text: line.children?.length ? line.children[0].text : ''}
    }

    update(line) {
        if (line.type && line.type !== this.line?.type) this.#updateType(line.type)

        for (const key in line) {
            if (key === 'id') continue
            this.line[key] = line[key]
        }

        if (this.line.children && this.line.children.length === 1 ) {
            const child = {...this.line.children[0]}
            this.line.children = [child]
        }

        if (this.line.type === "action" && !this.line.character_id) {
            this.line.character_id = this.scriptMeta.charactersNames?.Narrator?.id
            this.line.isDialog = true
        }
        
        if (this.line.character_id && !this.line.isDialog && this.line.type !== 'character') {
            this.line.isDialog = true
        }

    }
}

let instance = null
export class ScriptMeta {
    charactersNames: {[key: string]: Character} = {}
    characters: Character[] = [] // existing characters from the remote db
    linesById: {[key: LineId]: Line} = {}
    linesByType: {[key: TokenType]: {[key: LineId]: Tokens} } = {}
    saveStatus: saveStatus = 'clean'
    scriptMetaId: string = null
    options: scriptMetaOptios = null

    constructor(characters: Character[] | null, lines: Tokens[] | null, options: scriptMetaOptios) {
        if (instance) return instance
        instance = this
        this.addCharacters(characters)
        this.addLines(lines)
        this.scriptMetaId = getId()
        this.options = options
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

    addLines(lines) {
        if (!lines) return;
        if (!Array.isArray(lines)) {
            this.onLineChage([lines], ADD)   
            return 
        };
        if (!lines.length) return;

        this.onLineChage(lines, ADD)
    }
    
    changeLines(lines, info) {
        if (!lines) return;
        if (!Array.isArray(lines)) {
            this.onLineChage([lines], MODIFY)   
            return 
        };

        if (!lines.length) return;

        this.onLineChage(lines, MODIFY)
    }
    removeLines(lines) {
        if (!lines) return;
        if (!Array.isArray(lines)) {
            this.onLineChage([lines], DELETE)   
            return 
        };

        if (!lines.length) return;

        this.onLineChage(lines, DELETE)
    }

    getLine(lineId: string) {
        if (!lineId) return
        return this.linesById[lineId]?.getLine()
    }

    getCharacters() {
        // this.updateCharacterNameMap()
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
                const line = this.linesById[lineId]
                const text = line?.line?.text || line?.text || (line?.children && line?.children[0] && line?.children?.length ? line.children[0]?.text : null)

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

                this.linesById[lineId].character_id =  id
            }

            for (const name of names) {
                if (name.toLocaleLowerCase() === "narrator") continue
                delete this.charactersNames[name]
            }

            if (this.options && this.options.onCharacterChange) {
                setTimeout(() => {
                    this.options.onCharacterChange(this.getNewCharacters())
                }, 0)
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

         if (!line.id) {
            throw 'Change does not have id'
        }

        if (!this.linesByType[type]) {
            this.linesByType[type] = {}
        }

        this.linesByType[type][line.id] = line

    }
    
    onLineChage(changes, updateType) {
        let isCharacter = false
        for (const change of changes) {
            let line = null
            if (!change.id) {
                throw 'Change does not have id'
            }
            if (!isCharacter && change.type === 'character') {
                isCharacter = true
            }
            switch(updateType) {
                case ADD:   
                    this.linesById[change.id] = new Line(change, this)
                break;
                case MODIFY:
                    line = this.linesById[change.id]
                    if (line) {
                        line.update(change)
                    } else {
                        this.linesById[change.id] = new Line(change, this)
                    }
                break;
                case DELETE:
                    line = this.linesById[change.id]
                    if (!line) return
                    this.removeLineFromType(line)
                    delete this.linesById[change.id]
                break;
            }
        }

        if (isCharacter) {
            this.updateCharacterNameMap()
        }
    }
}
