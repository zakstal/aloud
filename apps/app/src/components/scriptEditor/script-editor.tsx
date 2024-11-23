'use client'

import './script-editor.css';

import { TokenContent, Tokens, GetElement, isTokenType, tokenTypes } from './script-tokens'
import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useFountainNodes } from './useFountainNodes'
import { createEditor, Transforms, Editor, Element, Path } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'
import { withHistory } from 'slate-history'
import { max } from 'date-fns';
import { v4 as uuid } from 'uuid';

import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { slateYjsSyncPlugin, withYjs } from 'slate-yjs';


type Character = {
    name: string,
    gender: string | null,
}

interface ScriptEditorInput {
    scriptTokens: Tokens[];
    className: string;
    audioVersionNumber: string;
    audioScreenPlayVersion: string,
    audioScreenPlayVersionStatus: string,
    pdfText: string,
    saveLines: () => null,
    setCharacters: (characters: string[]) => null,
    setSaveFunc: () => null,
    setIsEditorDirty: () => null,
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


function createDebounce() {
    let id = null
    let callback = null
    return (callbackIn, immediate) => {
        console.log("immediate", immediate)
        if (immediate) {
            id && clearTimeout(id)
            return callbackIn()
        }
        callback = callbackIn
        if (id) return
        id = setTimeout(() => {
            callback()
            id = null
        }, 5000)

    }
}

export const CollaborativeEditor = () => {
    const [connected, setConnected] = useState(false)
    const [sharedType, setSharedType] = useState()
    const [provider, setProvider] = useState()
  
    // Set up your Yjs provider and document
    useEffect(() => {
      const yDoc = new Y.Doc()
      const sharedDoc = yDoc.get('slate', Y.XmlText)
  
      // Set up your Yjs provider. This line of code is different for each provider.
      const yProvider = new YjsProvider(/* ... */)
  
      yProvider.on('sync', setConnected)
      setSharedType(sharedDoc)
      setProvider(yProvider)
  
      return () => {
        yDoc?.destroy()
        yProvider?.off('sync', setConnected)
        yProvider?.destroy()
      }
    }, [])
  
    if (!connected || !sharedType || !provider) {
      return <div>Loading…</div>
    }
  
    return <SlateEditor />
  }

export const ScriptEditor =({
    scriptTokens,
    className,
    audioScreenPlayVersion,
    audioScreenPlayVersionStatus,
    pdfText,
    saveLines,
    setCharacters,
    screenplayId,
    characters,
    currentTokenId,
    highlightToken,
    selectToken,
    setSaveFunc,
    setIsEditorDirty,
}: ScriptEditorInput) => {
    const myRef = useRef(null);
    const yDoc = new Y.Doc()
    const sharedDoc = yDoc.get('slate', Y.XmlText)

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
                initialValue={slateTokens.length ? slateTokens : [{ 
                    type: 'action',
                    children: [{ 
                        text: '',
                        id: getId() ,
                    }],
                }]}
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
                    onPaste={(value) => {
                        console.log('onPaste------------', value)
                    }}
                    onKeyUp={event => {
                        console.log("key up---")
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
                        console.log("key down---")
                        // Get the currently selected node
                        const [node, path] = Editor?.node(editor, editor?.selection) || [];
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
        </>
    )
}