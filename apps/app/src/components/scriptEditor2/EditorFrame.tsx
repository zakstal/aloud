import Caret from "./Caret";
import React, { useCallback } from "react";
import { Node } from "slate";
import {
  Editable,
  ReactEditor,
  RenderLeafProps,
  Slate,
  useSlate,
} from "slate-react";
import {GetElement, isTokenType, tokenTypes, tokenize  } from './script-tokens'
import { Transforms, Editor, Element as SElement, Path } from 'slate'
import { v4 as uuid } from 'uuid';

export interface EditorFrame {
  editor: ReactEditor;
  value: Node[];
  initialValue: Node[];
  onChange: (value: Node[]) => void;
  decorate: any;
  className: string;
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

const idSet = new Set()
const getId = (): string => {
    const id  = uuid()
    if (idSet.has(id)) return getId()
    idSet.add(id)
    return id
};

function createChangeType (type: string) {
  return (node: Node, editor: Editor) => { 
      if (node.type === type ) return
      console.log('isTokenType(type, node.text as any)', isTokenType(type, node.text as any))
      console.log("type", type)
      console.log("node", node)
      if (!isTokenType(type, node.text as any)) return

      Transforms.setNodes(
          editor,
          { type },
          { match: n => SElement.isElement(n) && Editor.isBlock(editor, n) }
      )
  }
}

const maybeChangeNodeTypeTo = Object.fromEntries(
  Object.values(tokenTypes).map(type => [type, createChangeType(type)])
)


const renderElement = (props: any) => <GetElement {...props} />;

const EditorFrame: React.FC<EditorFrame> = ({
  editor,
  value,
  initialValue,
  onChange,
  decorate,
  className,
}) => {
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, [
    decorate,
  ]);

  return (
    <div className={className + ' script-editor'}>
      <Slate editor={editor} value={value} onChange={onChange} initialValue={initialValue}>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          decorate={decorate}
          onPaste={(event) => {

              event.preventDefault();

              // Get clipboard data
              const clipboardData = event.clipboardData //|| window.clipboardData as any;
              const pastedText = clipboardData.getData('text/plain');
          
              // Check if text is pasted
              if (pastedText) {
                  console.log('Pasted content:', pastedText);
          
                  // Split the pasted text into lines
                  const lines = tokenize(pastedText).reverse();

                  // @ts-ignore
                  const slateTokens = lines.map((obj: AloudNode) => {
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
              const [node, path] = Editor.node(editor, editor.selection as any);
              if (event.key === 'Enter') {
                  const [lastNode, lastPath] = Editor.last(editor, path);
                  const isLastCharacter = isTokenType(tokenTypes.character, lastNode.text as any)
                  
                  const nextType = isLastCharacter ? tokenTypes.dialogue : tokenTypes.action
                  
                  Transforms.setNodes(
                      editor,
                      { 
                          type: nextType,
                          id: getId() 
                      },
                      { match: n => SElement.isElement(n) && Editor.isBlock(editor, n) }
                  )

                  return
              }
          }}
          onKeyDown={event => {
              console.log("key down---")
              // Get the currently selected node
              const [node, path] = Editor.node(editor, editor.selection as any) || [];
              const [lastNode, lastPath] = Editor.last(editor, path);

              if (event.key === 'Tab') {
                  event.preventDefault()
                  // const isCharacter = isTokenType(tokenTypes.character, lastNode.text)
                  const isText = lastNode.text !== ''
                  
                  const nextType = isText ? tokenTypes.dialogue : tokenTypes.character
                  Transforms.setNodes(
                      editor,
                      { type: nextType },
                      { match: n => SElement.isElement(n) && Editor.isBlock(editor, n) }
                      
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
  );
};

export default EditorFrame;



const Leaf: React.FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  const data = leaf.data as any;

  return (
    <span
      {...attributes}
      style={
        {
          position: "relative",
          backgroundColor: data?.alphaColor,
        } as any
      }
    >
      {leaf.isCaret ? <Caret {...(leaf as any)} /> : null}
      {children}
    </span>
  );
};
