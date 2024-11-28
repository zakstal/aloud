'use client'

import './script-editor.css';
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createEditor, Node } from "slate";
import { withHistory } from "slate-history";
import { withReact } from "slate-react";
import {
  SyncElement,
  toSharedType,
  useCursors,
  withCursor,
  withYjs,
} from "slate-yjs";
// import { WebsocketProvider } from "y-websocket";
import { WebsocketProvider } from "@v1/y-supabase-2";
import SupabaseProvider from "@v1/y-supabase/index";
import { WebrtcProvider } from 'y-webrtc';
import * as Y from "yjs";
import EditorFrame from "./EditorFrame";
import { withLinks } from "./plugins/link";
import randomColor from "randomcolor";
import { Tokens } from './script-tokens'
import { createClient } from "@v1/supabase/client";
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

interface ScriptEditorInput {
    scriptTokens: Tokens[];
    className: string;
    userId: string;
    audioVersionNumber: string;
    audioScreenPlayVersion: string,
    audioScreenPlayVersionStatus: string,
    pdfText: string,
    saveLines: () => null,
    setCharacters: (characters: string[]) => null,
    setSaveFunc: () => null,
    setIsEditorDirty: (boolean) => null,
    selectToken: (id: string) => null,
    screenplayId: string,
    characters: Character[]
    currentTokenId?: string;
    highlightToken?: boolean;
}

function getChanges(oldTokens, updatedTokens, screenplayId, newCharacters) {
  console.log("updatedTokens", updatedTokens)
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


  const slateTokens = scriptTokens.map((obj: AloudNodeSlate) => {
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

  const [isClean, setIsClean] = useState(false);
  const [value, setValue] = useState<Node[]>([]);
  const [newCharacters, setNewCharacters] = useState<Node[]>([]);
  const [isOnline, setOnlineState] = useState<boolean>(false);

  const color = useMemo(
    () =>
      randomColor({
        luminosity: "dark",
        format: "rgba",
        alpha: 1,
      }),
    []
  );

  const [sharedType, provider] = useMemo(() => {
    const doc = new Y.Doc();
    const sharedType = doc.getArray<SyncElement>("content");
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

  const editor = useMemo(() => {
    const editor = withCursor(
      withYjs(withLinks(withReact(withHistory(createEditor()))), sharedType),
      provider.awareness
    );

    return editor;
  }, [sharedType, provider]);

  // console.log('editor===========', editor.history)

  useEffect(() => {
    // Hack to wipe some initial changes we don't want to track
    editor.history.undos = []
    provider.on("status", ({ status }: { status: string }) => {
      setOnlineState(status === "connected");
    });

    console.log('user-------', user)
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

  const debounce = useCallback(createDebounce(), [])
  const save = useCallback((scriptTokens, newTokens, screenplayId, getNewCharacters, immediate = false, toastAlert = false) => {
      return debounce(async () => {
          setIsClean(true)
          const newCharacters = getNewCharacters && getNewCharacters()
          // const changes = getChanges(scriptTokens, newTokens, screenplayId, newCharacters)
          // // if (editor.history.redos.length) return
      
          // if (!changes) return
          // console.log("save0-------------", changes)
          // // const res = await saveLines(changes, toastAlert)
          
          // // console.log('res----', res)
          // setIsEditorDirty(false)

          // return res // only returned when immediate is true
      }, immediate)
  
  }, []) //scriptTokens, tokens, screenplayId, getNewCharacters


  // useEffect(() => {
  //     myRef.current && myRef.current.focus()
  // }, [myRef])

  useEffect(() => {
      setSaveFunc(() => save(scriptTokens, editor.children, screenplayId, null, true, true))
  }, [scriptTokens, screenplayId, isClean])

  // // Save loop
  useEffect(() => {
      // Don't allow autosaving because autosaving creates a new auidioScreenplayVersion
      if (isClean) return
      setIsEditorDirty(true)
      if (audioScreenPlayVersionStatus == 'inProgress') return
      save(scriptTokens, editor.children, screenplayId, null)
  }, [audioScreenPlayVersionStatus, isClean])


  const { decorate } = useCursors(editor);

  return (
      <EditorFrame
        editor={editor}
        value={value}
        initialValue={slateTokens}
        decorate={decorate}
        className={className}
        onChange={(value: Node[]) => {
          setIsClean(false)
          // console.log("editor", processHistoryWithText(editor.history.undos))
          console.log('editor.history.undos', editor)
          // setValue(value)
        }}
      />

  );
};

export default Client;

