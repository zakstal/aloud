'use client'

import './script-editor.css';

import { TokenContent, Tokens, GetElement, isTokenType, tokenTypes } from './script-tokens'
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFountainNodes } from './useFountainNodes'
import { createEditor, Transforms, Editor, Element, Path } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'
import { withHistory } from 'slate-history'
import { max } from 'date-fns';
import { v4 as uuid } from 'uuid';

type Character = {
    name: string,
    gender: string | null,
}

interface ScriptEditorInput {
    scriptTokens: Tokens[];
    className: string;
    audioVersionNumber: string;
    audioScreenPlayVersion: string,
    pdfText: string,
    saveLines: () => null,
    setCharacters: (characters: string[]) => null,
    selectToken: (id: string) => null,
    screenplayId: string,
    characters: Character[]
    currentTokenId?: string;
    highlightToken?: boolean;
}


const idSet = new Set()
const getId = () => {
    const id  = uuid()
    if (idSet.has(id)) return getId()
    idSet.add(id)
    return id
};

function getChanges(oldTokens, updatedTokens, screenplayId, newCharacters, characters) {

    const narrator = characters.find(character => character.name.toLowerCase() === 'narrator')
    // update ordering 
    updatedTokens.forEach((token, i) => {
        token.order = i
    })

    console.log("after order update", JSON.stringify(updatedTokens, null, 2))

    const newIds = {}

    // const newTokens = []
    const removeTokens = []
    const updateTokens = []

    // check if new tokens have been created
    for (const newToken of updatedTokens) {
        const id = newToken.id


        // if (!id || id?.startsWith('internal')) {
        //     console.log("newToken", newToken)
        //     newToken.id = newToken.id.replace('internal', '')
        //     newTokens.push(newToken)
        //     continue
        // }

        newIds[id] =  newToken
    }

    console.log('newIds', newIds)
    
    // check if tokens have been removed or changed
    for (const oldToken of oldTokens) {
        const id = oldToken.id
        const newToken = newIds[id]

        // check if removed
        if (!newToken) {
            removeTokens.push(oldToken)
            continue
        }


        // check if changed
        const isSame = 
            newToken.text === oldToken.text &&
            newToken.order === oldToken.order &&
            newToken.isDialog === oldToken.isDialog &&
            newToken.type === oldToken.type

        if (!isSame) {
            if (typeof newToken.isDialog === 'string') {
                
            }
            updateTokens.push(newToken)
        }

        delete newIds[id]
    }


    console.log('newCharacters--', newCharacters)
    const newTokens = Object.values(newIds)
    const names = new Set(characters.map(obj => obj.name))

    return {
        created: newTokens,
        removed: removeTokens,
        updated: updateTokens,
        screenplayId,
        characters: newCharacters
        // characters: [ ...newCharacters, ...characters ]
    }

}

function createChangeType (type) {
    return (node, editor) => { 
        if (node.type === type ) return
        if (!isTokenType(type, node.text)) return

        Transforms.setNodes(
            editor,
            { type },
            { match: n => Element.isElement(n) && Editor.isBlock(editor, n) }
        )
    }
}

const maybeChangeNodeTypeTo = Object.fromEntries(
    Object.values(tokenTypes).map(type => [type, createChangeType(type)])
)


export const ScriptEditor =({
    scriptTokens,
    className,
    audioScreenPlayVersion,
    pdfText,
    saveLines,
    setCharacters,
    screenplayId,
    characters,
    currentTokenId,
    highlightToken,
    selectToken,
}: ScriptEditorInput) => {

    const myRef = useRef(null);
    // const [
    //     tokens, 
    //     handleKeyDown, 
    //     handleKeyUp, 
    //     handleEnter, 
    //     handleOnBackSpace,
    //     clearCurrrentNode, 
    //     setCurrentNode, 
    //     handleOnSelect,
    //     handlePaste,
    //     handleCut,
    //     getNewCharacters
    // ] = useFountainNodes(scriptTokens, audioScreenPlayVersion, pdfText, setCharacters, characters)

    // useEffect(() => {
    //     myRef.current && myRef.current.focus()
    // }, [myRef])

    const renderElement = useCallback(props => <GetElement {...props} />, [])
    const editor = useMemo(() => withReact(withHistory(createEditor())), [])

    // console.log("scriptTokens", scriptTokens)

    const slateTokens = scriptTokens.map(obj => {
        return {
            type: obj.type,
            id: obj.id,
            isDialog: obj.id,
            character_id: obj.character_id,
            order: obj.order,
            children: [{ 
                text: obj.text,
                id: obj.id,
            }],
          }
    })

    return (
        <>
        <button id="savebutton" onClick={async () => {
            console.log("save1-------------", JSON.stringify(tokens, null, 2))
            const changes = getChanges(scriptTokens, tokens, screenplayId, getNewCharacters(), characters)

            console.log("save0-------------", changes)
            const res = await saveLines(changes)
            console.log('res----', res)

        }}>Save----</button>


        <div className={className + ' script-editor'}>
            <Slate
                editor={editor}
                initialValue={slateTokens}
                onChange={(value) => {
                    console.log('value update', value)
                }}
            >
                <Editable
                    renderElement={renderElement}
                    spellCheck
                    autoFocus
                    onChange={(value) => {
                        console.log('onChange', value)
                    }}
                    onKeyUp={event => {
                        // event.preventDefault()
                        const [node, path] = Editor.node(editor, editor.selection);
                        if (event.key === 'Enter') {
                            const [lastNode, lastPath] = Editor.last(editor, path);
                            const isLastCharacter = isTokenType(tokenTypes.character, lastNode.text)
                            
                            const nextType = isLastCharacter ? tokenTypes.dialogue : tokenTypes.action
                            
                            Transforms.setNodes(
                                editor,
                                { 
                                    type: nextType,
                                    id: getId() 
                                },
                                { match: n => Element.isElement(n) && Editor.isBlock(editor, n) }
                            )

                            return
                        }
                    }}
                    onKeyDown={event => {

                        // Get the currently selected node
                        const [node, path] = Editor.node(editor, editor.selection);
                        const [lastNode, lastPath] = Editor.last(editor, path);

                        if (event.key === 'Tab') {
                            event.preventDefault()
                            const isCharacter = isTokenType(tokenTypes.character, lastNode.text)
                            const isText = lastNode.text !== ''
                            
                            const nextType = isText ? tokenTypes.dialogue : tokenTypes.character
                            Transforms.setNodes(
                                editor,
                                { type: nextType },
                                { match: n => Element.isElement(n) && Editor.isBlock(editor, n) }
                                
                            )
                        }

                        if (node.type === tokenTypes.character) {
                            maybeChangeNodeTypeTo.dialogue(node, editor)
                        }

                        maybeChangeNodeTypeTo.character(node, editor)
                        maybeChangeNodeTypeTo.scene_heading(node, editor)
                        maybeChangeNodeTypeTo.transition(node, editor)

                      }}
                />
            </Slate>
        </div>
    
{/* 
        <div
            autoFocus
            ref={myRef}
            contentEditable={true}
            suppressContentEditableWarning={true} 
            className={className + ' script-editor'}
            onBlur={clearCurrrentNode}
            onMouseDown={setCurrentNode}
            onKeyUp={handleKeyUp}
            onPaste={handlePaste}
            onCut={handleCut}
            onClick={(e) => {
                const id = e.target.id
                const token = scriptTokens.find(token => token.id === id)
                console.log('id', id, 'token', token)
                if (token && token.isDialog) {
                    selectToken(id)
                }}
            }
            onSelect={function(event) {
                handleOnSelect(event)
            }}
            // onSelectChange={function(event) {
            //     console.log('Selection change');
            //     console.log('Element:', event.target);
            // }}
            onKeyDown={(e) => {

                if (e.key === 'Backspace') {
                   return  handleOnBackSpace(e)
                }
                if (e.key === 'Enter') {
                    return handleEnter(e)
                }

                handleKeyDown(e)
            }}

                
            >
                
                {/* <div style={{ position: 'sticky', top: 0 }}>currentOrderId: {currentOrderId}</div>
                <div>secondaryOrderId: {secondaryOrderId}</div> */}
            
            {/* <TokenContent
                tokens={tokens}
                currentTokenId={currentTokenId}
                highlightToken={highlightToken}
            /> */}
        {/* </div> */}
        </>
    )
}