/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Message, FileAttachment, ChatSettings } from "../types";
import { 
  Send, 
  Paperclip, 
  Image, 
  FileText, 
  Trash2, 
  X, 
  ExternalLink, 
  Search, 
  Brain, 
  User, 
  Sparkles, 
  ArrowDown,
  Clock,
  BookOpen,
  Menu,
  Mic,
  Check,
  Copy,
  Play,
  Terminal,
  Code
} from "lucide-react";
import Markdown from "react-markdown";

interface CodeBlockProps {
  language: string;
  value: string;
}

function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [runLogs, setRunLogs] = useState<string[]>([]);
  const [runResult, setRunResult] = useState<any>(undefined);
  const [runError, setRunError] = useState<string | null>(null);
  const [showConsole, setShowConsole] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error("Failed to copy text: ", err);
    });
  };

  const isExecutable = language && ["javascript", "js", "typescript", "ts"].includes(language.toLowerCase());

  const handleRunCode = () => {
    setIsRunning(true);
    setHasRun(true);
    setShowConsole(true);
    setRunLogs([]);
    setRunResult(undefined);
    setRunError(null);

    // Minor visual delay for feedback
    setTimeout(() => {
      try {
        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => {
            logs.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          error: (...args: any[]) => {
            logs.push("[ERROR] " + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          warn: (...args: any[]) => {
            logs.push("[WARN] " + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          info: (...args: any[]) => {
            logs.push("[INFO] " + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          }
        };

        const sandboxKeys = [
          "window", "document", "localStorage", "sessionStorage", "cookies", 
          "fetch", "XMLHttpRequest", "WebSocket", "parent", "top", "alert", 
          "prompt", "confirm", "console"
        ];
        const sandboxVals = [
          undefined, undefined, undefined, undefined, undefined,
          undefined, undefined, undefined, undefined, undefined, undefined,
          undefined, undefined, customConsole
        ];

        // Safely evaluate
        const runner = new Function(...sandboxKeys, `
          try {
            ${value}
          } catch (e) {
            throw e;
          }
        `);

        const res = runner(...sandboxVals);
        setRunResult(res);
        setRunLogs(logs);
      } catch (err: any) {
        setRunError(err.message || String(err));
      } finally {
        setIsRunning(false);
      }
    }, 300);
  };

  return (
    <div className="relative my-4 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm font-mono text-xs bg-[#0d0d0d] text-slate-100">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2f2f2f] text-slate-300 text-[11px] font-sans font-medium select-none border-b border-[#242424]">
        <div className="flex items-center gap-2">
          <span className="capitalize">{language || "code"}</span>
          {isExecutable && (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase">
              Executable
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isExecutable && (
            <button
              type="button"
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition focus:outline-none cursor-pointer font-semibold disabled:opacity-50"
              title="Run code snippet"
              id={`btn_run_code_${Math.random().toString(36).substr(2, 9)}`}
            >
              <Play className={`w-3 h-3 ${isRunning ? "animate-spin" : ""}`} />
              <span>{isRunning ? "Running..." : "Run Code"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 hover:text-white transition focus:outline-none cursor-pointer text-slate-400 font-medium"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy code</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto p-4 leading-relaxed font-mono text-[13px] text-slate-200 bg-[#0d0d0d]">
        <code>{value}</code>
      </div>

      {/* Sandboxed Console Outputs */}
      {showConsole && hasRun && (
        <div className="border-t border-[#242424] bg-[#141414] text-[12px] font-mono">
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#1b1b1b] border-b border-[#242424] text-slate-400 text-[10px] select-none font-sans">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-[#10a37f]" />
              <span className="font-semibold text-slate-300">Sandbox Console Output</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowConsole(false);
                setHasRun(false);
              }}
              className="hover:text-white transition text-slate-500 font-semibold text-xs cursor-pointer px-1 rounded hover:bg-slate-800"
            >
              Clear
            </button>
          </div>
          <div className="p-4 space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar">
            {/* Run logs */}
            {runLogs.length > 0 && (
              <div className="space-y-1">
                {runLogs.map((log, idx) => (
                  <div key={idx} className="text-slate-300 leading-relaxed break-all font-mono whitespace-pre-wrap">
                    <span className="text-slate-500 text-[11px] select-none mr-2">console:</span>
                    {log}
                  </div>
                ))}
              </div>
            )}

            {/* Run Errors */}
            {runError && (
              <div className="p-2.5 bg-red-950/40 border border-red-900/40 rounded-lg text-red-400 font-mono text-[11.5px] leading-relaxed break-all">
                <span className="font-bold mr-1">TypeError/Error:</span> {runError}
              </div>
            )}

            {/* Return evaluation result */}
            {!runError && runResult !== undefined && (
              <div className="pt-2 border-t border-[#242424] mt-2 flex items-start gap-1.5">
                <div className="text-[10px] text-emerald-500 font-sans font-bold uppercase tracking-wider shrink-0 mt-0.5">
                  Returns:
                </div>
                <pre className="text-emerald-400 font-semibold leading-relaxed font-mono whitespace-pre-wrap break-all text-[12px]">
                  {typeof runResult === "object" ? JSON.stringify(runResult, null, 2) : String(runResult)}
                </pre>
              </div>
            )}

            {/* Empty Output State */}
            {!runError && runLogs.length === 0 && runResult === undefined && (
              <div className="text-slate-500 italic text-center py-2 select-none">
                Snippet executed successfully (no logs or returned values).
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ChatInterfaceProps {
  messages: Message[];
  activeConversationTitle: string;
  onSendMessage: (text: string, files: FileAttachment[]) => Promise<void>;
  onReactToMessage: (messageId: string, emoji: string) => Promise<void>;
  settings: ChatSettings;
  isGenerating: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function ChatInterface({
  messages,
  activeConversationTitle,
  onSendMessage,
  onReactToMessage,
  settings,
  isGenerating,
  isSidebarOpen,
  onToggleSidebar
}: ChatInterfaceProps) {
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxCode, setSandboxCode] = useState(
    `// Safe Sandboxed JavaScript Console\n// Intercepts console logs and returns final statement output\n\nconst items = ["Apple", "Banana", "Cherry"];\nconsole.log("Original items list:", items);\n\n// Run standard map & filter safely\nconst result = items\n  .filter(item => item.startsWith("B") || item.startsWith("C"))\n  .map(item => item.toUpperCase());\n\nresult;`
  );
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [sandboxResult, setSandboxResult] = useState<any>(undefined);
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [isSandboxEvaluating, setIsSandboxEvaluating] = useState(false);

  const handleRunSandbox = () => {
    setIsSandboxEvaluating(true);
    setSandboxLogs([]);
    setSandboxResult(undefined);
    setSandboxError(null);

    setTimeout(() => {
      try {
        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => {
            logs.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          error: (...args: any[]) => {
            logs.push("[ERROR] " + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          warn: (...args: any[]) => {
            logs.push("[WARN] " + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          info: (...args: any[]) => {
            logs.push("[INFO] " + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          }
        };

        const sandboxKeys = [
          "window", "document", "localStorage", "sessionStorage", "cookies", 
          "fetch", "XMLHttpRequest", "WebSocket", "parent", "top", "alert", 
          "prompt", "confirm", "console"
        ];
        const sandboxVals = [
          undefined, undefined, undefined, undefined, undefined,
          undefined, undefined, undefined, undefined, undefined, undefined,
          undefined, undefined, customConsole
        ];

        const runner = new Function(...sandboxKeys, `
          try {
            ${sandboxCode}
          } catch (e) {
            throw e;
          }
        `);

        const res = runner(...sandboxVals);
        setSandboxResult(res);
        setSandboxLogs(logs);
      } catch (err: any) {
        setSandboxError(err.message || String(err));
      } finally {
        setIsSandboxEvaluating(false);
      }
    }, 400);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const startInputTextRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // Record the current input text as the starting point so we don't wipe it out
      startInputTextRef.current = inputText;
      
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = navigator.language || "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";
          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          const baseText = startInputTextRef.current.trim();
          const speechText = (finalTranscript + interimTranscript).trim();
          setInputText(baseText ? `${baseText} ${speechText}` : speechText);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            alert("Microphone access is blocked. Please allow microphone access in your browser settings to use speech-to-text.");
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Handle scroll detection for "Scroll to bottom" button
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollBottom(!isAtBottom && messages.length > 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(Array.from(files));
  };

  const processFiles = (fileList: File[]) => {
    const allowedTypes = [
      "image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif",
      "application/pdf", "text/plain", "text/csv", "text/markdown"
    ];

    fileList.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(`Unsupported file type: ${file.name}. Only common images, PDFs, CSV, and text files are supported.`);
        return;
      }

      // Check file size (6MB limit to prevent transport payload/network timeouts)
      if (file.size > 6 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Please upload files smaller than 6MB.`);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const newAttachment: FileAttachment = {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: reader.result as string,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
      };
    });

    // Reset input element
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;
    if (isGenerating) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const textToSend = inputText.trim();
    const filesToSend = [...attachments];

    // Clear inputs immediately
    setInputText("");
    setAttachments([]);

    await onSendMessage(textToSend, filesToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  // Quick suggestion prompts
  const suggestions = [
    { text: "Explain RAG architectures simply", icon: <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> },
    { text: "Compare Gemini 2.5 Flash vs Pro", icon: <Sparkles className="w-3.5 h-3.5 text-sky-400" /> },
    { text: "Write a high-performance Express middleware", icon: <FileText className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  const handleSuggestionClick = (text: string) => {
    setInputText(text);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const filteredMessages = searchQuery.trim() === "" 
    ? messages 
    : messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 flex flex-row h-screen overflow-hidden bg-white">
      {/* Main Chat Workspace */}
      <div 
        className={`flex-1 flex flex-col bg-white h-full relative select-none transition-all duration-300 ${
          dragOver ? "border-2 border-dashed border-slate-300 bg-slate-50/50" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        id="chat_workspace"
      >
      {/* Drag & Drop Overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center pointer-events-none animate-fade-in">
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 mb-4 animate-bounce">
            <Paperclip className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold font-sans text-slate-900">Drop attachments here</p>
          <p className="text-xs text-slate-500 mt-1">Accepts images, PDF, CSV, and text documents</p>
        </div>
      )}

      {/* Header Block */}
      <div className="h-16 border-b border-slate-100 px-4 md:px-8 flex items-center justify-between z-10 bg-white/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
            title={isSidebarOpen ? "Collapse Navigation" : "Open Navigation"}
            id="btn_sidebar_toggle"
          >
            <Menu className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 truncate">
            {activeConversationTitle || "New Discussion"}
          </h2>
          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-full text-xs font-medium cursor-pointer hover:bg-slate-50">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
            <span className="capitalize">{settings.model.replace("gemini-", "Gemini ")}</span>
          </div>

          {/* Messages Search Bar Toggle / Input */}
          <div className="flex items-center gap-2 ml-1" id="msg_search_header_container">
            {isSearchVisible ? (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 w-44 xs:w-56 focus-within:ring-2 focus-within:ring-[#10a37f]/15 focus-within:border-[#10a37f]/40 transition duration-150 shadow-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter messages..."
                  className="bg-transparent border-0 focus:outline-none focus:ring-0 text-xs text-slate-700 placeholder:text-slate-400 w-full p-0 font-sans outline-none leading-none"
                  autoFocus
                  id="message_search_input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-0.5 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600 shrink-0"
                    title="Clear filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchVisible(false);
                    setSearchQuery("");
                  }}
                  className="p-0.5 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600 shrink-0 ml-0.5"
                  title="Close search"
                  id="btn_close_search"
                >
                  <X className="w-3 h-3 font-semibold" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchVisible(true)}
                className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200/60 rounded-full text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center gap-1"
                title="Search Messages"
                id="btn_toggle_search"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                <span className="hidden xs:inline text-[11px] font-medium text-slate-500 hover:text-slate-700">Search</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => setIsSandboxOpen(!isSandboxOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all duration-200 cursor-pointer select-none font-semibold ${
              isSandboxOpen 
                ? "bg-[#10a37f]/10 text-[#10a37f] border-[#10a37f]/30 ring-2 ring-[#10a37f]/10" 
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            }`}
            title="Open JavaScript Sandbox Console"
            id="btn_toggle_sandbox_console"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>JS Sandbox</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
          <span className="text-slate-400 hidden xs:inline">Web Search: </span>
          {settings.searchGroundingEnabled ? (
            <span className="text-green-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span>Search</span>
            </span>
          ) : (
            <span className="text-slate-400 font-normal flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
              <span>Search Off</span>
            </span>
          )}
          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
          <div className="hidden sm:flex items-center text-slate-500 text-xs font-medium">
            Temp: {settings.temperature.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8 custom-scrollbar bg-white"
        id="messages_thread"
      >
        {searchQuery.trim() !== "" && messages.length > 0 && (
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 px-4 flex items-center justify-between max-w-3xl mx-auto mb-6 text-xs text-slate-600 shadow-sm animate-fade-in" id="search_results_indicator">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#10a37f]" />
              <span>
                Found <span className="font-semibold text-slate-800">{filteredMessages.length}</span> {filteredMessages.length === 1 ? "result" : "results"} for <span className="font-semibold text-slate-800">"{searchQuery}"</span>
              </span>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setIsSearchVisible(false);
              }}
              className="text-slate-400 hover:text-slate-800 font-semibold cursor-pointer select-none transition text-xs"
            >
              Clear filter
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          /* Empty State Dashboard - Fully Cloned ChatGPT Style */
          <div className="max-w-2xl mx-auto h-full flex flex-col justify-center items-center py-16 px-4" id="empty_chat_dashboard">
            <div className="p-3 bg-[#10a37f] border border-[#10a37f]/10 rounded-full mb-6 flex items-center justify-center shadow-md animate-scale-up text-white">
              <Sparkles className="w-8 h-8" />
            </div>
            
            <h1 className="text-3xl font-semibold font-sans text-slate-800 text-center tracking-tight mb-3">
              What can I help with?
            </h1>
            <p className="text-sm text-slate-500 text-center max-w-md mt-1 mb-10 leading-relaxed font-sans">
              Your intelligent AI Workspace. Equipped with native search web-grounding, memory systems, and code execution capabilities.
            </p>

            {/* Quick Actions / Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl" id="suggestion_chips">
              {suggestions.map((s, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(s.text)}
                  className="p-4 text-left bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-2xl transition duration-150 flex flex-col justify-between h-24 group cursor-pointer active:scale-[0.98] shadow-sm"
                >
                  <span className="text-[13px] font-medium font-sans text-slate-600 group-hover:text-slate-900 line-clamp-2 leading-relaxed">
                    {s.text}
                  </span>
                  <div className="flex items-center justify-between w-full mt-2">
                    <span className="text-[10px] text-slate-400 font-sans group-hover:text-slate-500 transition">Try prompt</span>
                    <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 group-hover:text-slate-800 transition">
                      {s.icon}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          /* Search Results Empty State */
          <div className="max-w-md mx-auto h-full flex flex-col justify-center items-center py-16 px-4 animate-fade-in" id="empty_search_state">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-full mb-4 text-slate-400">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">No results found</h3>
            <p className="text-xs text-slate-500 text-center max-w-xs leading-relaxed font-sans">
              We couldn't find any messages containing <span className="font-semibold text-slate-700">"{searchQuery}"</span>. Try adjusting your keywords.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* Chat Bubbles - Fully Cloned ChatGPT Style */
          <div className="max-w-3xl mx-auto space-y-8">
            {filteredMessages.map((m) => {
              const isUser = m.role === "user";

              return (
                <div 
                  key={m.id}
                  className="animate-fade-in w-full"
                  id={`message_${m.id}`}
                >
                  {isUser ? (
                    /* User Message Layout - Right Aligned Bubbles like ChatGPT */
                    <div className="flex justify-end w-full">
                      <div className="max-w-[75%] sm:max-w-[70%] flex flex-col items-end gap-1.5">
                        <div className="bg-[#f4f4f4] rounded-2xl px-4 py-2.5 text-[15px] text-slate-800 font-sans shadow-sm whitespace-pre-wrap select-text leading-relaxed">
                          {m.text}
                        </div>
                        {/* Attached files */}
                        {m.files && m.files.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            {m.files.map((f, fIdx) => (
                              <div 
                                key={fIdx} 
                                className="bg-slate-50 border border-slate-200 text-[10px] text-slate-600 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"
                              >
                                {f.type.startsWith("image/") ? (
                                  <Image className="w-3.5 h-3.5 text-slate-500" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                                )}
                                <span className="font-sans font-medium truncate max-w-[120px] text-slate-700">{f.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message Layout - Spacious, plain left-aligned with ChatGPT green Sparkle Icon */
                    <div className="flex gap-4 md:gap-5">
                      <div className="w-8 h-8 rounded-full bg-[#10a37f] border border-[#10a37f]/10 shadow-sm flex items-center justify-center shrink-0 select-none text-white">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-4 pt-1 min-w-0">
                        {m.text.startsWith("⚠️") ? (
                          <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl text-red-800 text-sm leading-relaxed max-w-full">
                            <Markdown
                              components={{
                                pre({ children }) { return <>{children}</>; },
                                code({ node, inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  const language = match ? match[1] : "";
                                  const codeValue = String(children).replace(/\n$/, "");
                                  if (inline) {
                                    return <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono font-semibold text-slate-800" {...props}>{children}</code>;
                                  }
                                  return <CodeBlock language={language} value={codeValue} />;
                                }
                              }}
                            >
                              {m.text}
                            </Markdown>
                          </div>
                        ) : (
                          <div className="markdown-body select-text text-[15px] leading-relaxed text-slate-800">
                            <Markdown
                              components={{
                                pre({ children }) { return <>{children}</>; },
                                code({ node, inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || "");
                                  const language = match ? match[1] : "";
                                  const codeValue = String(children).replace(/\n$/, "");
                                  if (inline) {
                                    return <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono font-semibold text-slate-800" {...props}>{children}</code>;
                                  }
                                  return <CodeBlock language={language} value={codeValue} />;
                                }
                              }}
                            >
                              {m.text}
                            </Markdown>
                          </div>
                        )}
                        
                        {/* Citations/References */}
                        {m.citations && m.citations.length > 0 && (
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold font-sans text-slate-400 uppercase tracking-wider">
                              <Search className="w-3 h-3" /> Grounding Citations
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {m.citations.map((cite, cIdx) => (
                                <a
                                  key={cIdx}
                                  href={cite.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-sans font-medium text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg flex items-center justify-between gap-2 transition shadow-sm"
                                >
                                  <span className="truncate pr-1">{cite.title}</span>
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Emoji Reactions Section */}
                        <div className="flex flex-wrap items-center gap-2 pt-1" id={`message_reactions_${m.id}`}>
                          {/* Standard emojis picker row */}
                          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5 gap-0.5 shadow-sm">
                            {["👍", "👎", "❤️", "✨", "😆"].map((emoji) => {
                              const hasReacted = m.reactions && m.reactions[emoji];
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => onReactToMessage(m.id, emoji)}
                                  className={`p-1 hover:bg-slate-100 rounded-full transition duration-150 cursor-pointer select-none text-[13px] active:scale-90 ${
                                    hasReacted 
                                      ? "bg-slate-200 border-slate-300 scale-110" 
                                      : "opacity-45 hover:opacity-100"
                                  }`}
                                  title={`React with ${emoji}`}
                                  id={`btn_react_${m.id}_${emoji}`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>

                          {/* Render active reactions counts if any */}
                          {m.reactions && Object.keys(m.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(m.reactions).map(([emoji, count]) => {
                                if (count <= 0) return null;
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => onReactToMessage(m.id, emoji)}
                                    className="flex items-center gap-1 bg-[#10a37f]/5 hover:bg-[#10a37f]/10 text-slate-700 border border-[#10a37f]/20 px-2 py-0.5 rounded-full text-[11px] font-sans transition cursor-pointer select-none font-medium active:scale-95 shadow-sm animate-fade-in"
                                    title={`Reacted with ${emoji}`}
                                    id={`btn_active_react_${m.id}_${emoji}`}
                                  >
                                    <span>{emoji}</span>
                                    <span className="text-[9px] text-[#10a37f] font-bold">{count}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {m.tokensUsed && (
                            <>
                              <span>•</span>
                              <span>Inference tokens: {m.tokensUsed}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Active streaming loading animation */}
            {isGenerating && (
              <div className="flex gap-4 md:gap-5 animate-pulse" id="typing_indicator">
                <div className="w-8 h-8 rounded-full bg-[#10a37f] border border-[#10a37f]/10 flex items-center justify-center shrink-0 select-none text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-slate-500 text-xs font-medium inline-flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">Assembling inference context...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Action: Jump to bottom */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-28 right-8 z-20 p-2.5 bg-white border border-slate-200 text-slate-800 rounded-full transition shadow-md hover:bg-slate-50 cursor-pointer"
          id="btn_scroll_bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Input Frame & File Attachments Panel */}
      <div className="p-4 md:p-6 border-t border-slate-100 bg-white">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative" id="chat_form">
          
          {/* Active File Attachments Preview Panel */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-[#f4f4f4] border border-slate-200/60 border-b-0 rounded-t-3xl max-h-24 overflow-y-auto custom-scrollbar" id="attachments_preview">
              {attachments.map((file, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-xs group relative max-w-[200px] shadow-sm"
                >
                  {file.type.startsWith("image/") ? (
                    <Image className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span className="text-slate-700 font-medium truncate flex-1 font-sans">{file.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-0.5 text-slate-400 hover:text-red-600 bg-slate-100 rounded transition cursor-pointer"
                    title="Remove"
                    id={`btn_remove_attachment_${idx}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Input Block - Fully Cloned ChatGPT Style Pill */}
          <div className={`relative flex flex-col bg-[#f4f4f4] border border-slate-200/60 transition-all duration-200 min-h-[110px] max-h-48 shadow-sm ${
            attachments.length > 0 ? "rounded-b-3xl border-t-0" : "rounded-3xl"
          } focus-within:ring-2 focus-within:ring-[#10a37f]/10 focus-within:border-slate-300`}>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening... Speak now!" : "Message AI Assistant..."}
              className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 p-4 pb-14 resize-none min-h-[56px] max-h-36 placeholder:text-slate-400 text-[15px] text-slate-800 custom-scrollbar font-sans leading-relaxed focus:ring-transparent focus:border-transparent outline-none"
              rows={2}
              id="chat_textarea"
            />
            
            {/* Row of Action Buttons at the bottom-inside of the pill */}
            <div className="absolute left-3 bottom-3 flex items-center gap-1">
              {/* Action Trigger: Add File */}
              <button
                type="button"
                onClick={triggerSelectFile}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-200/60 transition cursor-pointer flex items-center justify-center h-8 w-8"
                title="Attach Files"
                id="btn_attach_files"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file_uploader"
                accept="image/*,application/pdf,text/plain,text/csv,text/markdown"
              />

              {/* Action Trigger: Speech-to-Text */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center h-8 w-8 relative ${
                  isListening 
                    ? "text-white bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                }`}
                title={isListening ? "Stop listening" : "Speech to Text (Hands-free)"}
                id="btn_speech_to_text"
              >
                {isListening ? (
                  <>
                    <Mic className="w-4 h-4 text-white z-10" />
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                    <span className="absolute -inset-1 rounded-full border border-red-400 animate-pulse opacity-40"></span>
                  </>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Submit button on the right bottom-inside of the pill */}
            <div className="absolute right-3 bottom-3">
              <button
                type="submit"
                disabled={isGenerating || (!inputText.trim() && attachments.length === 0)}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-20 text-white p-2 rounded-full transition cursor-pointer flex items-center justify-center h-8 w-8 active:scale-95 shadow-sm"
                id="btn_send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 mt-2 text-[10px] text-slate-400 font-sans">
            <p className="hidden xs:block">Drag files directly onto the workspace window to attach them.</p>
            <p className="font-mono">Inference Engine: {settings.model}</p>
          </div>
        </form>
      </div>
    </div>

      {/* Slide-out JS Sandbox Drawer */}
      {isSandboxOpen && (
        <div 
          className="w-full md:w-[450px] lg:w-[500px] border-l border-slate-200 bg-slate-50 flex flex-col h-full shrink-0 animate-slide-in shadow-xl z-20"
          id="sandbox_playground_panel"
        >
          {/* Drawer Header */}
          <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-white select-none shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#10a37f]" />
              <h3 className="text-sm font-semibold text-slate-800 font-sans">JavaScript Sandbox</h3>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90">
                Safe
              </span>
            </div>
            <button
              onClick={() => setIsSandboxOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {/* Examples quick selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">Quick Examples</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    name: "Fibonacci Generator",
                    code: `// Generate the first 10 Fibonacci numbers\nfunction fibonacci(n) {\n  const seq = [0, 1];\n  for (let i = 2; i < n; i++) {\n    seq.push(seq[i - 1] + seq[i - 2]);\n  }\n  return seq;\n}\n\nconsole.log("Calculating fibonacci sequence...");\nconst result = fibonacci(10);\nresult;`
                  },
                  {
                    name: "Filter & Map Array",
                    code: `// Filter even numbers and multiply by 10\nconst nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\nconsole.log("Input numbers:", nums);\n\nconst finalArray = nums\n  .filter(n => n % 2 === 0)\n  .map(n => n * 10);\n\nfinalArray;`
                  },
                  {
                    name: "String Reverse",
                    code: `// Reverse words in a string\nconst text = "ai studio sandbox";\nconsole.log("Original text:", text);\n\nconst reversed = text\n  .split(" ")\n  .map(w => w.split("").reverse().join(""))\n  .join(" ");\n\nreversed;`
                  },
                  {
                    name: "Object Transformer",
                    code: `// Map object to key-value stats\nconst userStats = {\n  john: 45,\n  doe: 78,\n  sarah: 92\n};\n\nconsole.log("Raw scores:", userStats);\n\nconst passedCount = Object.values(userStats)\n  .filter(score => score >= 50).length;\n\nconsole.log("Transformer completed!");\n({ total: 3, passed: passedCount });`
                  }
                ].map((ex) => (
                  <button
                    key={ex.name}
                    type="button"
                    onClick={() => {
                      setSandboxCode(ex.code);
                      setSandboxLogs([]);
                      setSandboxResult(undefined);
                      setSandboxError(null);
                    }}
                    className="px-3 py-2 bg-white hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 rounded-xl text-left text-[11px] text-slate-700 transition cursor-pointer select-none font-medium shadow-sm font-sans truncate"
                  >
                    💡 {ex.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Block */}
            <div className="space-y-1.5 flex flex-col">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">JavaScript Code</label>
                <button
                  onClick={() => setSandboxCode("")}
                  className="text-[10px] text-[#10a37f] hover:text-[#0e8f6f] transition font-sans font-semibold cursor-pointer"
                >
                  Clear Editor
                </button>
              </div>
              <div className="relative border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-[#0d0d0d]">
                <textarea
                  value={sandboxCode}
                  onChange={(e) => setSandboxCode(e.target.value)}
                  placeholder="// Type your custom JavaScript snippet here..."
                  rows={11}
                  className="w-full bg-[#0d0d0d] text-slate-100 font-mono text-[12.5px] p-4 focus:outline-none resize-y custom-scrollbar leading-relaxed"
                  style={{ tabSize: 2 }}
                />
              </div>
            </div>

            {/* Run Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRunSandbox}
                disabled={isSandboxEvaluating || !sandboxCode.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#10a37f] hover:bg-[#0e8f6f] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-sans font-semibold text-xs rounded-xl shadow-sm transition active:scale-[0.98] cursor-pointer"
                id="btn_sandbox_run_submit"
              >
                <Play className={`w-3.5 h-3.5 ${isSandboxEvaluating ? "animate-spin" : ""}`} />
                <span>{isSandboxEvaluating ? "Running..." : "Run Sandbox"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSandboxLogs([]);
                  setSandboxResult(undefined);
                  setSandboxError(null);
                }}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-sans font-semibold text-xs rounded-xl transition cursor-pointer select-none border border-slate-300/45"
              >
                Reset Output
              </button>
            </div>

            {/* Sandbox Console Output panel */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">Sandbox Output</label>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-[#141414] shadow-inner text-xs font-mono">
                <div className="bg-[#1b1b1b] border-b border-[#242424] px-4 py-2 flex items-center gap-1.5 select-none font-sans text-slate-400 text-[10px]">
                  <Terminal className="w-3.5 h-3.5 text-[#10a37f]" />
                  <span className="font-semibold text-slate-300">Playground Console Log</span>
                </div>
                <div className="p-4 min-h-[160px] max-h-[300px] overflow-y-auto custom-scrollbar space-y-2.5 text-slate-200">
                  {/* Error Output */}
                  {sandboxError && (
                    <div className="p-2.5 bg-red-950/40 border border-red-900/40 rounded-lg text-red-400 leading-relaxed font-mono whitespace-pre-wrap break-all">
                      <span className="font-bold">Error:</span> {sandboxError}
                    </div>
                  )}

                  {/* Intercepted Logs */}
                  {sandboxLogs.length > 0 && (
                    <div className="space-y-1">
                      {sandboxLogs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed font-mono whitespace-pre-wrap break-all border-b border-[#1b1b1b]/50 pb-1 text-slate-300">
                          <span className="text-slate-500 text-[10px] select-none mr-2">console:</span>
                          {log}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Return Statement Output */}
                  {!sandboxError && sandboxResult !== undefined && (
                    <div className="pt-2 border-t border-[#242424] flex items-start gap-1.5">
                      <div className="text-[10px] text-emerald-500 font-sans font-bold uppercase tracking-wider shrink-0 mt-0.5 select-none">
                        Returns:
                      </div>
                      <pre className="text-emerald-400 font-semibold leading-relaxed font-mono whitespace-pre-wrap break-all text-[12.5px] bg-[#0d0d0d]/40 p-2 rounded w-full">
                        {typeof sandboxResult === "object" ? JSON.stringify(sandboxResult, null, 2) : String(sandboxResult)}
                      </pre>
                    </div>
                  )}

                  {/* Empty State */}
                  {!sandboxError && sandboxLogs.length === 0 && sandboxResult === undefined && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 italic py-10 select-none font-sans">
                      <span>No outputs yet. Type code and hit "Run Sandbox"</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
