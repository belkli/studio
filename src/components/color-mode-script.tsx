// src/components/color-mode-script.tsx
// Server component — renders a blocking <script> tag in <head>.
// Runs before body paint to set data-color-mode from localStorage.
// dangerouslySetInnerHTML is safe: content is a hardcoded literal, never user input.

export function ColorModeScript() {
  const scriptContent = [
    '(function(){',
    '  try{',
    '    var s=localStorage.getItem("lyriosa-color-mode");',
    '    var d=window.matchMedia("(prefers-color-scheme: dark)").matches;',
    '    var m=s==="dark"?"dark":s==="light"?"light":d?"dark":null;',
    '    if(m)document.documentElement.setAttribute("data-color-mode",m);',
    '  }catch(e){}',
    '})();',
  ].join('')

  return (
    // biome-ignore lint: dangerouslySetInnerHTML is safe — content is a hardcoded literal
    <script dangerouslySetInnerHTML={{ __html: scriptContent }} suppressHydrationWarning />
  )
}
