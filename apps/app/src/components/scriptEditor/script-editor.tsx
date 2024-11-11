'use client'

import './script-editor.css';

import { TokenContent, Tokens } from './script-tokens'
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFountainNodes } from './useFountainNodes'

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

function getChanges(oldTokens, updatedTokens, screenplayId, newCharacters) {
    // update ordering 
    updatedTokens.forEach((token, i) => {
        if (!token) return
        token.order = i
    })

    const newIds = {}

    // const newTokens = []
    const removeTokens = []
    const updateTokens = []

    // check if new tokens have been created
    for (const newToken of updatedTokens) {
        const id = newToken?.id
        if (!id) continue

        newIds[id] =  newToken
    }
    
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

    const newTokens = Object.values(newIds)

    const shoudlUpdate = 
        Boolean(newTokens?.length) || 
        Boolean(removeTokens?.length) ||
        Boolean(updateTokens?.length) || 
        Boolean(newCharacters?.length)


    if (!shoudlUpdate) return null

    return {
        created: newTokens,
        removed: removeTokens,
        updated: updateTokens,
        screenplayId,
        characters: newCharacters
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
    const save = useCallback(async () => {
        const newCharacters = getNewCharacters && getNewCharacters()
        const changes = getChanges(scriptTokens, tokens, screenplayId, newCharacters)
    
        if (!changes) return
        console.log("save0-------------", changes)
        const res = await saveLines(changes)
        console.log('res----', res)
    
    }, [scriptTokens, tokens, screenplayId, getNewCharacters])


    useEffect(() => {
        myRef.current && myRef.current.focus()
    }, [myRef])
    
    // Save loop
    useEffect(() => {
        debounce(save)
    }, [tokens])

    // this is necessary because if you are typing in the editor
    // and an update happens becuase of say, a save event, and the component is not memoed 
    // then you will loose your cursor position.
    const tokenContent = useMemo(() =>   
        <TokenContent
            tokens={tokens}
            currentTokenId={currentTokenId}
            highlightToken={highlightToken}
        />, [tokens,
            currentTokenId,
            highlightToken])


    return (
        <>
            {/* <button id="savebutton" onClick={}>Save----</button> */}
            <div
                autoFocus
                ref={myRef}
                contentEditable={true}
                suppressContentEditableWarning={true} 
                className={className + ' script-editor'}
                onBlur={() => {
                    // save()
                    clearCurrrentNode()
                }}
                onMouseDown={setCurrentNode}
                onKeyUp={handleKeyUp}
                onPaste={handlePaste}
                onCut={handleCut}
                onClick={(e) => {
                    const id = e.target.id
                    const token = scriptTokens.find(token => token.id === id)

                    if (token && token.isDialog) {
                        selectToken(id)
                    }}
                }
                onSelect={function(event) {
                    handleOnSelect(event)
                }}
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
                {tokenContent}        
            </div>
        </>
    )
}