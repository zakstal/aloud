'use client'

import './script-editor.css';

import { TokenContent, Tokens } from './script-tokens'
import { useRef, useEffect, useCallback, useMemo } from 'react';
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

    console.log('newTokens', Boolean(newTokens?.length))
    console.log('removeTokens', Boolean(removeTokens?.length))
    console.log('updateTokens', Boolean(updateTokens?.length))
    console.log('newCharacters', Boolean(newCharacters?.length))

    const shoudlUpdate = 
        Boolean(newTokens?.length) || 
        Boolean(removeTokens?.length) ||
        Boolean(updateTokens?.length) || 
        Boolean(newCharacters?.length)

        console.log('shoudlUpdate----------', shoudlUpdate)
    if (!shoudlUpdate) return null

    return {
        created: newTokens,
        removed: removeTokens,
        updated: updateTokens,
        screenplayId,
        characters: newCharacters
        // characters: [ ...newCharacters, ...characters ]
    }

}

function createDebounce() {
    let id = null
    let callback = null
    return (callbackIn) => {
        callback = callbackIn
        if (id) return
        id = setTimeout(() => {
            callback()
            id = null
        }, 5000)

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
        getNewCharacters
    ] = useFountainNodes(scriptTokens, audioScreenPlayVersion, pdfText, setCharacters, characters, screenplayId)

    const debounce = useCallback(createDebounce(), [])


    useEffect(() => {
        myRef.current && myRef.current.focus()
    }, [myRef])
    
    // Save loop
    useEffect(() => {
        debounce(async () => {
            console.log("save1-------------", JSON.stringify(tokens, null, 2))
            const newCharacters = getNewCharacters && getNewCharacters()
            const changes = getChanges(scriptTokens, tokens, screenplayId, newCharacters, characters)
        
            if (!changes) return
            console.log("save0-------------", changes)
            const res = await saveLines(changes)
            console.log('res----', res)
        
        })
    }, [tokens])

    const tokenContent = useMemo(() =>   
        <TokenContent
            tokens={tokens}
            currentTokenId={currentTokenId}
            highlightToken={highlightToken}
        />, [tokens,
            currentTokenId,
            highlightToken])

    console.log("scriptTokens", scriptTokens)
    console.log("tokens", tokens)

    return (
        <>
        {/* <button id="savebutton" onClick={}>Save----</button> */}
        

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
            {tokenContent}
          
        </div>
        </>
    )
}