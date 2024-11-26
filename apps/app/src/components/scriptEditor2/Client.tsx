'use client'

import './script-editor.css';
import React, { useEffect, useMemo, useState } from "react";
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
import { WebsocketProvider } from "y-websocket";
import { WebrtcProvider } from 'y-webrtc';
import * as Y from "yjs";
import EditorFrame from "./EditorFrame";
import { withLinks } from "./plugins/link";
import randomColor from "randomcolor";
import { Tokens } from './script-tokens'


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
    setIsEditorDirty: () => null,
    selectToken: (id: string) => null,
    screenplayId: string,
    characters: Character[]
    currentTokenId?: string;
    highlightToken?: boolean;
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
  const [value, setValue] = useState<Node[]>([]);
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
    // const sharedType = doc.get("slate", Y.XmlText);
    const provider = new WebsocketProvider(WEBSOCKET_ENDPOINT, audioScreenPlayVersion, doc, {
      connect: false,
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

  useEffect(() => {
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
        // toSharedType(sharedType, [
        //   { type: "paragraph", children: [{ text: "Hello world!" }] },
        // ]);
      }
    });

    provider.connect();

    return () => {
      provider.disconnect();
    };
  }, [provider]);

  const { decorate } = useCursors(editor);

  const toggleOnline = () => {
    isOnline ? provider.disconnect() : provider.connect();
  };

  return (

      <EditorFrame
        editor={editor}
        value={value}
        initialValue={slateTokens}
        decorate={decorate}
        className={className}
        onChange={(value: Node[]) => setValue(value)}
      />

  );
};

export default Client;

