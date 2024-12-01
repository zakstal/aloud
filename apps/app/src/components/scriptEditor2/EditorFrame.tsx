import Caret from "./Caret";
import React, { useCallback, useMemo } from "react";
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
import { getId } from './utils'
import { ScriptMeta } from './scriptMeta'

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
  children: AloudChildNodeSlate[];
}



function createChangeType (type: string, editor: Editor) {
  return (node: Node) => { 
      if (node.type === type ) return
      if (!isTokenType(type, node.text as any)) return

      Transforms.setNodes(
          editor,
          { type } as any, // not sure what type this shoudl be
          { match: n => SElement.isElement(n) && Editor.isBlock(editor, n) }
      )
  }
}

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

  const maybeChangeNodeTypeTo = useMemo(() => {
    return Object.fromEntries(
      Object.values(tokenTypes).map(type => [type, createChangeType(type, editor)])
    )
  }, [editor])

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
              // event.preventDefault()
              const [node, path] = Editor.node(editor, editor.selection as any);

              maybeChangeNodeTypeTo.character(node)
              if (event.key === 'Enter') {
                  const [lastNode, lastPath] = Editor.last(editor, path);
                  const isLastCharacter = isTokenType(tokenTypes.character, lastNode.text as any)
                  
                  const nextType = isLastCharacter ? tokenTypes.dialogue : tokenTypes.action
                  
                  const newChange =  { 
                    type: nextType,
                    id: getId(),
                  }

                  Transforms.setNodes(
                      editor,
                      newChange,
                      { match: n => SElement.isElement(n) && Editor.isBlock(editor, n) }
                  )

                  return
              }
          }}
          onKeyDown={event => {
              // Get the currently selected node
              const [node, path] = Editor.node(editor, editor.selection as any) || [];
              const [lastNode, lastPath] = Editor.last(editor, path);

              if (event.key === 'Tab') {
                  event.preventDefault()
                  const isText = lastNode.text !== ''
                  
                  const nextType = isText ? tokenTypes.dialogue : tokenTypes.character
                  
                  Transforms.setNodes(
                      editor,
                      { type: nextType },
                      { match: n => SElement.isElement(n) && Editor.isBlock(editor, n) }
                      
                  )
              }

              if (node.type === tokenTypes.character) {
                  maybeChangeNodeTypeTo.dialogue(node)
              }

              maybeChangeNodeTypeTo.scene_heading(node)
              maybeChangeNodeTypeTo.transition(node)

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
