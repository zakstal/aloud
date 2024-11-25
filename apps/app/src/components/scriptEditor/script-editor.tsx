'use client'

import './script-editor.css';
import { TokenContent, Tokens, GetElement, isTokenType, tokenTypes, tokenize  } from './script-tokens'
import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useFountainNodes } from './useFountainNodes'
import { createEditor, Transforms, Editor, Element, Path } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'
import { withHistory } from 'slate-history'
import { max } from 'date-fns';
import { v4 as uuid } from 'uuid';

import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { withYjs, YjsEditor } from '@slate-yjs/core'


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



const CollaborativeEditor = ({ children, initialValue, roomName }) => {
    const [connected, setConnected] = useState(false)
    const [sharedType, setSharedType] = useState()
    const [provider, setProvider] = useState()
  
    // Connect to your Yjs provider and document
    useEffect(() => {
      const yDoc = new Y.Doc()
      const sharedDoc = yDoc.get('slate', Y.XmlText)
  
      // Set up your Yjs provider. This line of code is different for each provider.

    //   if (sharedDoc.length === 0) {
    //     sharedDoc.insert(0, JSON.stringify(initialValue));
    //   }

      console.log("sharedDoc-------", sharedDoc)
  
      const yProvider = new WebrtcProvider(roomName, yDoc, { signaling: ['ws://localhost:4444'] });
  
      yProvider.on('sync', setConnected)
      setSharedType(sharedDoc)
      setProvider(yProvider)
  
      return () => {
        yDoc?.destroy()
        yProvider?.off('sync', setConnected)
        yProvider?.destroy()
      }
    }, [])

    console.log("sharedType", )
  
  //   if (!connected || !sharedType || !provider) {
    if (!sharedType || !provider) {
      return <div>Loading…</div>
    }
  
    return <SlateEditor sharedType={sharedType} provider={provider} children={children} initialValue={initialValue} />
  }

  /**
   * TODO
   * In order to make this work properly we need to add two things
   * - webrtc signal server. We can probably do this with supabase
   * - some way to sync saving if two peers and the server. If one peer saves the other needs to update too.
   * 
   */
  
  const SlateEditor = ({ sharedType, provider, children, initialValue }) => {
    const [connected, setConnected] = useState(false)
    const editor = useMemo(() => {
      console.log("slate edit strt---")
    //   const e = withReact(createEditor(), [])
      const e = withReact(withYjs(createEditor(), sharedType))
  
      // Ensure editor always has at least 1 valid child
      const { normalizeNode } = e
      e.normalizeNode = entry => {
        const [node] = entry
  
        if (Editor.isEditor(node) && node.children.length === 0) {
            Transforms.insertNodes(editor, {
                type: 'action',
                children: [{ text: '' }],
            }, { at: [0] });
            return; // Exit early to avoid additional normalization
        }
    
        normalizeNode(entry); // Call the original normalization logic
      }
  
      console.log('e---', e)
      return e
    }, [])
    
  
    useEffect(() => {
      YjsEditor.connect(editor)
      setConnected(true)
      return () => YjsEditor.disconnect(editor)
    }, [editor])

    // NB this is important because the initialValues will load first before YjsEditor.connect(editor)
    // if this is not here and then YjsEditor.connect(editor) wipes out the initialValues
    if (!connected) return <div>Loading more</div>
  
    return (
      <Slate editor={editor} initialValue={initialValue}>
        {children(editor)}
      </Slate>
    )
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


    const renderElement = useCallback(props => <GetElement {...props} />, [])


    const slateTokens = scriptTokens.map(obj => {
        return {
            type: obj.type,
            id: obj.id,
            isDialog: Boolean(obj.isDialog),
            character_id: obj.character_id || '',
            order: obj.order,
            children: [{ 
                text: obj.text || ' ',
                id: obj.id,
            }],
          }
    })

    console.log('slateTokens', audioScreenPlayVersion, slateTokens)

    return (
        <>
        <div className={className + ' script-editor'}>
            <CollaborativeEditor
                roomName={audioScreenPlayVersion}
                initialValue={slateTokens.length ? slateTokens : [{ 
                            type: 'action',
                            children: [{ 
                                text: '',
                                id: getId() ,
                            }],
                        }]}>
            
                    {(editor) => 
                        <Editable
                            renderElement={renderElement}
                            spellCheck
                            autoFocus

                            onChange={(value) => {
                                console.log('onChange', value)
                            }}
                            onPaste={(event) => {

                                event.preventDefault();

                                // Get clipboard data
                                const clipboardData = event.clipboardData || window.clipboardData;
                                const pastedText = clipboardData.getData('text/plain');
                            
                                // Check if text is pasted
                                if (pastedText) {
                                    console.log('Pasted content:', pastedText);
                            
                                    // Split the pasted text into lines
                                    const lines = tokenize(pastedText).reverse();
                            
                                    // // Transform each line into a Slate-compatible format
                                    // const fragments = lines.map(line => ({
                                    //     type: 'action', // Example default type
                                    //     children: [{ text: line }],
                                    // }));

                                    const slateTokens = lines.map(obj => {
                                        return {
                                            type: obj.type,
                                            id: obj.id,
                                            isDialog: Boolean(obj.isDialog),
                                            character_id: obj.character_id || '',
                                            order: obj.order,
                                            children: [{ 
                                                text: obj.text || ' ',
                                                id: obj.id,
                                            }],
                                          }
                                    })
                            
                                    // Insert the fragments into the editor
                                    const { selection } = editor;
                                    if (selection) {
                                        Transforms.insertNodes(editor, slateTokens, { at: selection.focus });
                                    }
                                }
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

                        }
            </CollaborativeEditor>
        </div>
        </>
    )
}