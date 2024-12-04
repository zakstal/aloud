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
  setIsClean: (isClean: boolean) => void;
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
  setIsClean,
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
          onKeyDown={event => {
              setIsClean(false)
              // Get the currently selected node

              const [node, path] = Editor.node(editor, editor.selection as any) || [];
              const isEnter = event.key === 'Enter'
              const isTab = event.key === 'Tab'

              if (!isEnter && !isTab) {
                maybeChangeNodeTypeTo.character(node)
                maybeChangeNodeTypeTo.scene_heading(node)
                maybeChangeNodeTypeTo.transition(node)
                return 
              }
              
              const [lastNode, lastPath] = Editor.last(editor, path);
              const lastNodeParentPath = Path.parent(lastPath);
              const lastNodeParent = Node.get(editor, lastNodeParentPath)
              const nodeParentPath = Path.parent(path);
              const nodeParent = Node.get(editor, nodeParentPath)

              const isLastParenthetical = tokenTypes.parenthetical === lastNodeParent.type

              if (isTab) {
                  event.preventDefault()
                  const isText = node.text !== ''

                  const isLastCharacter = tokenTypes.character === lastNodeParent.type
                  const isCurrentCharacter = isTokenType(tokenTypes.character, node.text as any)
                  if ((!isText && !isLastCharacter && !isLastParenthetical) || isCurrentCharacter) {
                    Transforms.setNodes(
                      editor,
                      { type: tokenTypes.character },
                      { match: n => SElement.isElement(n) && Editor.isBlock(editor, n) }
                      
                    )
                    return
                  }


                  const isParenthetical = isTokenType(tokenTypes.parenthetical, node.text as any)
                  console.log('isParenthetical', isParenthetical)
                  const nextType = isParenthetical ? tokenTypes.parenthetical : tokenTypes.dialogue
                  Transforms.setNodes(
                    editor,
                    { type: nextType },
                    { match: n => SElement.isElement(n) && Editor.isBlock(editor, n) }
                    
                  )
                  return

              }

              if (isEnter) {

                // Slate's Transforms.splitNodes (implicitly invoked during the default Enter handling) 
                // does not complete on this cycle. Without the setTimeout the below logic will affect
                // both the old and new node.
                setTimeout(() => {
                  const isLastCharacter = tokenTypes.character === lastNodeParent.type

                  const nextType = isLastCharacter || isLastParenthetical ? tokenTypes.dialogue : tokenTypes.action
                  Transforms.setNodes(
                    editor,
                    { type: nextType, id: getId() },
                    { match: n => SElement.isElement(n) && Editor.isBlock(editor, n) }
                    
                  )
                }, 0)
                return

              }
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
