import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, 
  Eye, 
  Download, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  FileText, 
  Globe, 
  Image as ImageIcon,
  Share2,
  RefreshCw,
  X
} from 'lucide-react';
import { Artifact } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../lib/utils';

interface ArtifactViewProps {
  artifact: Artifact | null;
  onClose: () => void;
}

export const ArtifactView: React.FC<ArtifactViewProps> = ({ artifact, onClose }) => {
  const [view, setView] = useState<'preview' | 'code'>('code');
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  if (!artifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIcon = () => {
    switch (artifact.type) {
      case 'web': return <Globe size={18} />;
      case 'code': return <Code2 size={18} />;
      case 'markdown': return <FileText size={18} />;
      case 'image': return <ImageIcon size={18} />;
      default: return <FileText size={18} />;
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className={cn(
        "fixed right-0 top-0 h-full bg-[#1A1A1A] border-l border-[#333] z-40 flex flex-col transition-all duration-300",
        isMaximized ? "w-full" : "w-[45%]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#242424]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#333] rounded-lg text-blue-400">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white truncate max-w-[200px]">
              {artifact.title}
            </h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
              v{artifact.version} • {artifact.type}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {artifact.type === 'web' && (
            <div className="flex bg-[#333] rounded-lg p-1 mr-2">
              <button 
                onClick={() => setView('code')}
                className={cn(
                  "px-3 py-1 text-xs rounded-md transition-all flex items-center gap-2",
                  view === 'code' ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
                )}
              >
                <Code2 size={14} /> Código
              </button>
              <button 
                onClick={() => setView('preview')}
                className={cn(
                  "px-3 py-1 text-xs rounded-md transition-all flex items-center gap-2",
                  view === 'preview' ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
                )}
              >
                <Eye size={14} /> Preview
              </button>
            </div>
          )}

          <button 
            onClick={handleCopy}
            className="p-2 hover:bg-[#333] rounded-lg text-gray-400 transition-colors"
            title="Copiar código"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
          
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 hover:bg-[#333] rounded-lg text-gray-400 transition-colors"
          >
            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-[#0D0D0D]">
        <AnimatePresence mode="wait">
          {view === 'code' ? (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full overflow-auto custom-scrollbar"
            >
              <SyntaxHighlighter
                language={artifact.language || 'typescript'}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '24px',
                  background: 'transparent',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
                showLineNumbers
              >
                {artifact.content}
              </SyntaxHighlighter>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-white"
            >
              <iframe
                srcDoc={artifact.content}
                title="Preview"
                className="h-full w-full border-none"
                sandbox="allow-scripts"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="p-3 px-4 border-t border-[#333] bg-[#1A1A1A] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            <RefreshCw size={10} /> Sincronizado: {new Date(artifact.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
           <button className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
             <Share2 size={10} /> Compartir
           </button>
           <button className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1">
             <Download size={10} /> Descargar
           </button>
        </div>
      </div>
    </motion.div>
  );
};
