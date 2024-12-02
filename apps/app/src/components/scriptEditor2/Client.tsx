'use client'

import './script-editor.css';
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Transforms, createEditor, Editor, Node, Path } from "slate";
import { withHistory } from "slate-history";
import { withReact, ReactEditor } from "slate-react";
import {
  SyncElement,
  toSharedType,
  useCursors,
  withCursor,
  withYjs,
} from "slate-yjs";
import { WebsocketProvider } from "@v1/y-supabase";
import { WebrtcProvider } from 'y-webrtc';
import * as Y from "yjs";
import EditorFrame from "./EditorFrame";
import { withLinks } from "./plugins/link";
import randomColor from "randomcolor";
import { Tokens } from './script-tokens'
import { createClient } from "@v1/supabase/client";
import { getId } from './utils'
import { ScriptMeta } from './scriptMeta'

const supabase = createClient();

const WEBSOCKET_ENDPOINT =
  process.env.NODE_ENV === "production"
    ? "wss://demos.yjs.dev/slate-demo"
    : "ws://localhost:1234";


type Character = {
    name: string,
    gender: string | null,
}

type AloudNode = {
  type: string;
  id: string;
  isDialog: boolean | null;
  character_id: string;
  order: number;
  text: string;
}

type AloudChildNodeSlate = {
  id: string;
  text: string;
}
type AloudNodeSlate = {
  type: string;
  id: string;
  isDialog: boolean | null;
  character_id: string;
  order: number;
  children: AloudChildNodeSlate[],
}

type SaveLinesChanges = {
  newLines: AloudNode[],
  screenplayId: string,
  characters: Character[],
  versionNumber: number,
}

interface ScriptEditorInput {
    scriptTokens: Tokens[];
    className: string;
    userId: string;
    audioVersionNumber: string;
    audioScreenPlayVersion: string,
    audioScreenPlayVersionStatus: string,
    pdfText: string,
    saveLines: (changes: SaveLinesChanges, toastAlert: boolean) => null,
    setCharacters: (characters: string[]) => null,
    setSaveFunc: () => null,
    setIsEditorDirty: (boolean) => null,
    selectToken: (id: string) => null,
    screenplayId: string,
    characters: Character[]
    currentTokenId?: string;
    highlightToken?: boolean;
    // user
}

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


const Client: React.FC<ScriptEditorInput> = ({ 
  scriptTokens,
  className,
  audioScreenPlayVersion,
  user,
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
}) => {

  let slateTokens = null
  if (scriptTokens && scriptTokens.length) {
      slateTokens = scriptTokens.map((obj: AloudNodeSlate) => {
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
    } else {
      const narrator = characters?.find(character => character.name === "Narrator")
      const id = getId()

      slateTokens = [{
          type: 'action',
          isDialog: true,
          order: 1,
          id,
          character_id: narrator?.id,
          children: [{ 
                text:  ' ',
                id,
          }]
      }]
    }

  const [isClean, setIsClean] = useState(false);
  const [value, setValue] = useState<Node[]>([]);
  const [newCharacters, setNewCharacters] = useState<Node[]>([]);
  const [isOnline, setOnlineState] = useState<boolean>(false);
  const scriptMetaRef = useRef(null)

  // Random color for cursor of the other collaborators
  const color = useMemo(
    () =>
      randomColor({
        luminosity: "dark",
        format: "rgba",
        alpha: 1,
      }),
    []
  );


  // Set up provider. This is the colab code. 
  const [sharedType, provider] = useMemo(() => {
    const doc = new Y.Doc();
    const sharedType = doc.getArray<SyncElement>("content");
    console.log('sharedType.length', sharedType.length)
    if (sharedType.length === 0) {
      toSharedType(sharedType, slateTokens);
    }

    // const sharedType = doc.get("slate", Y.XmlText);
  //   const provider = new SupabaseProvider(doc, supabase, {
  //     channel: audioScreenPlayVersion,
  //     id: audioScreenPlayVersion,
  //     tableName: "notes", // not used atm
  //     columnName: "document", // not used atm
  // })
    const provider = new WebsocketProvider(WEBSOCKET_ENDPOINT, audioScreenPlayVersion, doc, {
      connect: false,
      supabase,
      channel: audioScreenPlayVersion,
    });


    return [sharedType, provider];
  }, [user?.id]);
  // }, [id]);


  // Set up provider listeners. This is the colab code. 
  useEffect(() => {
    // Hack to wipe some initial changes we don't want to track
    editor.history.undos = []

    provider.on("status", ({ status }: { status: string }) => {
      setOnlineState(status === "connected");
    });

    provider.awareness.setLocalState({
      alphaColor: color.slice(0, -2) + "0.2)",
      color,
      name: user?.email,
    });

    // Super hacky way to provide a initial value from the client, if
    // you plan to use y-websocket in prod you probably should provide the
    // initial state from the server.
    provider.on("sync", (isSynced: boolean) => {
      if (isSynced && sharedType.length === 0) {
        toSharedType(sharedType, slateTokens);
      }
    });

    provider.connect();

    return () => {
      provider.disconnect();
      // provider.destroy();
    };
  }, [provider]);

  const editor = useMemo(() => {
    const editor = withCursor(
      withYjs(withLinks(withReact(withHistory(createEditor()))), sharedType),
      provider.awareness
    );

    return editor;
  }, [sharedType, provider]);

  // create scriptMeta
  useEffect(() => {
    scriptMetaRef.current = new ScriptMeta(characters, slateTokens, {
      onCharacterChange: (newcCharacters) => {
        // setCharacters(newcCharacters)
        // console.log('newcCharacters', newcCharacters)
      }
    })

    scriptMetaRef.current.addLines(slateTokens)
  }, [])


  // Track changes of the editor in scriptMeta.
  // TODO move to a plugin
  useEffect(() => {
    const ogapply = editor.apply
    const scriptmeta = scriptMetaRef.current
    // TODO move to a plugin
    editor.apply = (op) => {

      ogapply(op)
      editor.operations.forEach(op => {
        console.log("apply", op)
          try {
              switch (op.type) {
                  case 'split_node':
                      // console.log('\n\nSplit Node Operation:', op);
                      if (Node.has(editor, op.path)) {
                          const firstNode = Node.get(editor, op.path);
                          const secondNodePath = Path.next(op.path);
                          const secondNode = Node.has(editor, secondNodePath)
                              ? Node.get(editor, secondNodePath)
                              : null;
    
                          if (firstNode?.type) {
                            scriptmeta.changeLines(firstNode, 'split node')
                          }
      
                          // console.log('split First Node (before split):', firstNode);
                          // console.log('split Second Node (after split):', secondNode);
                      }
                      break;
  
                  case 'merge_node':
                      // console.log('\n\nMerge Node Operation:', op);
                      if (Node.has(editor, op.path)) {
                          const mergedNode = Node.get(editor, op.path);
                          // console.log('Merged Node:', mergedNode);
                      }
                      break;
  
                  case 'set_node':
                      // console.log('\n\nSet Node Operation:', op);
                      if (Node.has(editor, op.path)) {
                          const node = Node.get(editor, op.path);
                          scriptmeta.changeLines(node, 'set node')
                          // console.log('Updated Node:', node);
                          // console.log('Old Properties:', op.properties);
                          // console.log('New Properties:', op.newProperties);
                      }
                      break;
  
                  case 'insert_text':
                      // console.log('\n\nInsert Text Operation:', op);
                      if (Node.has(editor, op.path)) {
                          const parentPath = Path.parent(op.path);
                          const node = Node.get(editor, parentPath)
                          scriptmeta.changeLines(node, 'insert node')
                          // console.log('Affected Node:', node);
                          // console.log('Inserted Text:', op.text);
                          // console.log('Offset:', op.offset);
                      }
                      break;
                  case 'insert_node':
                      // console.log('\n\nInsert Node Operation:', op);
                      if (Node.has(editor, op.path)) {
                          scriptmeta.changeLines(op.node, 'insert node')
                          // console.log('Affected Node:', node);
                          // console.log('Inserted Text:', op.text);
                          // console.log('Offset:', op.offset);
                      }
                      break;

                  
                  case 'remove_node':
                    // console.log('\n\nRemove Node Operation:', op);
                    const removedNode = op.node;
                    if (removedNode) {
                      // console.log("removedNode ", removedNode)
                        scriptmeta.removeLines(removedNode, 'remove node');
                        // console.log('Removed Node:', removedNode);
                    }
                    break;

                case 'remove_text':
                    // console.log('\n\nRemove Text Operation:', op);
                    if (Node.has(editor, op.path)) {
                        const parentPath = Path.parent(op.path);
                        const node = Node.get(editor, parentPath);
                        scriptmeta.changeLines(node, 'remove text');
                        // console.log('Affected Node:', node);
                        // console.log('Removed Text:', op.text);
                        // console.log('Offset:', op.offset);
                    }
                    break;    
  
                  default:
                      console.log('\n\nUnhandled Operation:', op);
                      break;
              }
          } catch (err) {
              console.error('Error processing operation:', err, 'Operation:', op);
          }
      });
    }
    
  },[])

  const debounce = useCallback(createDebounce(), [])
  const save = useCallback((immediate = false, toastAlert = false) => {
      return debounce(async () => {
          setIsClean(true)
          // if (!scriptMetaRef.current) return
          // TODO get character ids from script meta

          // const changes = getChanges(scriptTokens, newTokens, screenplayId, newCharacters)
          // if (editor.history.redos.length) return

          const lines = editor.children.map((obj: AloudNodeSlate) => {
            return scriptMetaRef.current?.getLine(obj.id)
          })

          console.log('lines outgoing', lines)
      
        const changes = {
          newLines: lines,
          screenplayId,
          characters: scriptMetaRef.current.getNewCharacters(),
          versionNumber: audioScreenPlayVersion,
        }
          console.log("save0-------------", changes)
        //   const res = await saveLines(changes, toastAlert)
          
        //   console.log('res----', res)
          // setIsEditorDirty(false)

          // return res // only returned when immediate is true
      }, immediate)
  
  }, []) //scriptTokens, tokens, screenplayId, getNewCharacters


  // set focus to the editor
  useEffect(() => {
    ReactEditor.focus(editor)
  }, [editor])

  // hacky way to allow parents to call the save button.
  useEffect(() => {
      setSaveFunc(() => save(true, true))
  }, [scriptTokens, screenplayId, isClean, audioScreenPlayVersion])

  // Save loop
  useEffect(() => {
      // Don't allow autosaving because autosaving creates a new auidioScreenplayVersion
      if (isClean) return
      setIsEditorDirty(true)
      if (audioScreenPlayVersionStatus == 'inProgress') return
      save()
  }, [audioScreenPlayVersionStatus, isClean])


  
  // Save where your cursor is at on load
  useEffect(() => {
      const handleUnload = () => saveSelection();
      window.addEventListener('beforeunload', handleUnload);
      return () => window.removeEventListener('beforeunload', handleUnload);
  }, [editor]);

  // Restore where your cursor is at on load and scroll to that position
  useEffect(() => {
    restoreSelectionAndScroll();
  }, [editor]);

  // Save cursor position 
  const saveSelection = () => {
      if (editor.selection) {
          const selection = JSON.stringify(editor.selection);
          localStorage.setItem(`editorSelection-${screenplayId}`, selection);
      }
  };

  // Restore cursor positon and scroll to that locaiton
  const restoreSelectionAndScroll = () => {
    const savedSelection = localStorage.getItem(`editorSelection-${screenplayId}`);
    if (savedSelection) {
        try {
            const selection = JSON.parse(savedSelection);

            // Restore the selection
            Transforms.select(editor, selection);

            // Scroll to the restored selection
            const domRange = ReactEditor.toDOMRange(editor, selection);
            const domElement = domRange.startContainer.parentElement;
            domElement.scrollIntoView({
                behavior: 'smooth', // Smooth scrolling
                // block: 'center',    // Scroll to center of the viewport
                inline: 'nearest',  // Align horizontally
            });

            // Focus the editor
            ReactEditor.focus(editor);

        } catch (err) {
            console.error('Failed to restore and scroll to selection:', err);
        }
    }
  };


  const { decorate } = useCursors(editor);

  return (
      <EditorFrame
        editor={editor}
        value={value}
        initialValue={slateTokens}
        decorate={decorate}
        className={className}
        setIsClean={setIsClean}
        onChange={() => {
          saveSelection()
        }}
      />

  );
};

export default Client;

