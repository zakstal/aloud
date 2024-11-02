'use client'

import './script-editor.css';

import { TokenContent, Tokens } from './script-tokens'
import { useRef, useEffect } from 'react';
import { useFountainNodes } from './useFountainNodes'
import { max } from 'date-fns';

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

function getChanges(oldTokens, updatedTokens, screenplayId, characters) {

    // update ordering 
    updatedTokens.forEach((token, i) => {
        token.order = i
    })

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


    console.log('newIds after', newIds)
    const newTokens = Object.values(newIds)

    return {
        created: newTokens,
        removed: removeTokens,
        updated: updateTokens,
        screenplayId,
        characters: characters.filter(character => character.id.startsWith('internal'))
    }

}

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
    const [
        tokens, 
        handleKeyDown, 
        handleKeyUp, 
        handleEnter, 
        handleOnBackSpace,
        clearCurrrentNode, 
        setCurrentNode, 
        handleOnSelect,
        handlePaste,
        handleCut,
    ] = useFountainNodes(scriptTokens, audioScreenPlayVersion, pdfText, setCharacters)

    useEffect(() => {
        myRef.current && myRef.current.focus()
    }, [myRef])

    console.log("update")
    return (
        <>
        <button id="savebutton" onClick={async () => {
            console.log("save1-------------", JSON.stringify(tokens, null, 2))
            const changes = getChanges(scriptTokens, tokens, screenplayId, characters)
            console.log("save1-------------", screenplayId, characters)
            console.log("save0-------------", changes)
            const res = await saveLines(changes)
            console.log('res----', res)

        }}>Save----</button>
        

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
            
            <TokenContent
                tokens={tokens}
                currentTokenId={currentTokenId}
                highlightToken={highlightToken}
              
            />
        </div>
        </>
    )
}