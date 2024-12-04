import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ScriptMeta } from './scriptMeta'

// Create a context
const ScriptMetaContext = createContext();

// Provider component to wrap around App
export function ScriptMetaProvider({ children }) {
  const [scriptMeta, setScriptMeta] = useState(null)

  useEffect(() => {
      const scriptMetaInstance = new ScriptMeta()
      setScriptMeta(scriptMetaInstance)
  }, [])

  return (
    <ScriptMetaContext.Provider value={scriptMeta}>
      {children}
    </ScriptMetaContext.Provider>
  );
}


export function useScriptMeta() {
    return useContext(ScriptMetaContext);
}
