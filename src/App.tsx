/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  getDocs,
  limit
} from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { UserProfile, Conversation, Message, Memory, ChatSettings, FileAttachment } from "./types";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import ChatInterface from "./components/ChatInterface";
import SettingsPanelComponent from "./components/Settings";
import MemoryPanel from "./components/MemoryPanel";
import { Sparkles, Brain, CheckCircle, ShieldAlert } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core Data State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);

  // Navigation / Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return false;
  });

  // Chat Settings state
  const [settings, setSettings] = useState<ChatSettings>({
    model: "gemini-3.5-flash",
    systemInstruction: "You are a professional, highly capable, production-grade AI Assistant designed by Google DeepMind. Answer questions with maximum clarity, using structured Markdown, list items, and syntax-highlighted code blocks where appropriate. Always remain objective and helpful.",
    searchGroundingEnabled: false,
    temperature: 0.7,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [memoryNotification, setMemoryNotification] = useState<string | null>(null);

  // Monitor Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: Date.now(),
        });
      } else {
        setUser(null);
        setConversations([]);
        setActiveConversationId(null);
        setMessages([]);
        setMemories([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Monitor user Conversations history in real-time
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "conversations"),
      where("userId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convList: Conversation[] = [];
      snapshot.forEach((docSnap) => {
        convList.push({ id: docSnap.id, ...docSnap.data() } as Conversation);
      });
      setConversations(convList);

      // Auto-select the first conversation if none is active and there are conversations
      if (convList.length > 0 && !activeConversationId) {
        setActiveConversationId(convList[0].id);
      }
    }, (error) => {
      console.error("Error monitoring conversations:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Monitor active Conversation Messages in real-time
  useEffect(() => {
    if (!user || !activeConversationId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", activeConversationId),
      where("userId", "==", user.uid),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList: Message[] = [];
      snapshot.forEach((docSnap) => {
        msgList.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });
      setMessages(msgList);
    }, (error) => {
      console.error("Error monitoring messages:", error);
    });

    return () => unsubscribe();
  }, [user, activeConversationId]);

  // Monitor user Memories vault in real-time
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "memories"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memList: Memory[] = [];
      snapshot.forEach((docSnap) => {
        memList.push({ id: docSnap.id, ...docSnap.data() } as Memory);
      });
      // Sort in-memory to avoid requiring a composite index
      memList.sort((a, b) => b.createdAt - a.createdAt);
      setMemories(memList);
    }, (error) => {
      console.error("Error monitoring memories:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Action: Create a brand new empty conversation state
  const handleCreateConversation = async () => {
    if (!user) return;

    try {
      const newConvRef = doc(collection(db, "conversations"));
      const newConv: Conversation = {
        id: newConvRef.id,
        userId: user.uid,
        title: "New Discussion",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: settings.model,
        searchGroundingEnabled: settings.searchGroundingEnabled,
      };

      await setDoc(newConvRef, newConv);
      setActiveConversationId(newConvRef.id);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  // Action: Delete custom conversation and its associated messages
  const handleDeleteConversation = async (convId: string) => {
    try {
      // 1. Delete conversation document
      await deleteDoc(doc(db, "conversations", convId));

      // 2. Delete all related messages
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", convId),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "messages", docSnap.id));
      });

      // 3. Reset active state if we deleted the current conversation
      if (activeConversationId === convId) {
        const remaining = conversations.filter((c) => c.id !== convId);
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          setActiveConversationId(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Action: Rename custom conversation
  const handleRenameConversation = async (convId: string, newTitle: string) => {
    try {
      await updateDoc(doc(db, "conversations", convId), {
        title: newTitle,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  };

  // Action: Add/remove emoji reaction to/from a message
  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      const msgRef = doc(db, "messages", messageId);
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const currentReactions = message.reactions || {};
      const updatedReactions = { ...currentReactions };

      if (updatedReactions[emoji]) {
        // Toggle off if already selected
        delete updatedReactions[emoji];
      } else {
        // Toggle on
        updatedReactions[emoji] = 1;
      }

      await updateDoc(msgRef, {
        reactions: updatedReactions,
      });
    } catch (err) {
      console.error("Failed to react to message:", err);
    }
  };

  // Send message processing pipeline
  const handleSendMessage = async (text: string, files: FileAttachment[]) => {
    if (!user) return;

    let convId = activeConversationId;
    let assistantMessageRef: any = null;

    try {
      // 1. If there is no active conversation, create one on the fly
      if (!convId) {
        const newConvRef = doc(collection(db, "conversations"));
        const newConv: Conversation = {
          id: newConvRef.id,
          userId: user.uid,
          title: text.length > 25 ? text.substring(0, 25) + "..." : text,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: settings.model,
          searchGroundingEnabled: settings.searchGroundingEnabled,
        };
        await setDoc(newConvRef, newConv);
        convId = newConvRef.id;
        setActiveConversationId(convId);
      } else {
        // Update the existing conversation title if it was still the default placeholder
        const activeConv = conversations.find((c) => c.id === convId);
        if (activeConv && activeConv.title === "New Discussion") {
          await updateDoc(doc(db, "conversations", convId), {
            title: text.length > 25 ? text.substring(0, 25) + "..." : text,
            updatedAt: Date.now(),
          });
        } else {
          // Just update the updatedAt timestamp
          await updateDoc(doc(db, "conversations", convId), {
            updatedAt: Date.now(),
          });
        }
      }

      // 2. Add user message to Firestore (Omitting large binary dataUrls to prevent Firestore payload & doc size limits)
      const userMessageRef = doc(collection(db, "messages"));
      const userMsg: Message = {
        id: userMessageRef.id,
        conversationId: convId,
        userId: user.uid,
        role: "user",
        text,
        createdAt: Date.now(),
        files: files.map((f) => ({ name: f.name, size: f.size, type: f.type, dataUrl: "" })),
      };
      await setDoc(userMessageRef, userMsg);

      // 3. Mark state as generating
      setIsGenerating(true);

      // 4. Create a placeholder message in Firestore for the incoming assistant streaming response
      assistantMessageRef = doc(collection(db, "messages"));
      const assistantPlaceholder: Message = {
        id: assistantMessageRef.id,
        conversationId: convId,
        userId: user.uid,
        role: "model",
        text: "",
        createdAt: Date.now() + 1, // Ensure sequential rendering order
      };
      await setDoc(assistantMessageRef, assistantPlaceholder);

      // 5. Build conversation message logs list to feed to our backend API
      // Fetch existing messages to supply complete multi-turn thread context
      const threadQ = query(
        collection(db, "messages"),
        where("conversationId", "==", convId),
        where("userId", "==", user.uid),
        orderBy("createdAt", "asc")
      );
      const threadSnap = await getDocs(threadQ);
      const messagesToSend: any[] = [];
      threadSnap.forEach((docSnap) => {
        const d = docSnap.data();
        // Skip assistant placeholder message itself, only include previous messages + user's current message
        if (docSnap.id !== assistantMessageRef.id) {
          if (docSnap.id === userMessageRef.id) {
            // For the CURRENT active message, inject the actual files containing their full binary dataUrl
            messagesToSend.push({
              role: d.role,
              text: d.text,
              files: files.map((f) => ({
                name: f.name,
                size: f.size,
                type: f.type,
                dataUrl: f.dataUrl
              })),
            });
          } else {
            // For HISTORICAL messages, send only the files metadata (no dataUrl base64 payload to save bandwidth & token cost)
            messagesToSend.push({
              role: d.role,
              text: d.text,
              files: (d.files || []).map((f: any) => ({
                name: f.name,
                size: f.size,
                type: f.type,
                dataUrl: ""
              })),
            });
          }
        }
      });

      // Include user memories as grounding context if available
      const memoryTexts = memories.map((m) => m.content);

      // 6. Connect to Express stream API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSend,
          model: settings.model,
          systemInstruction: settings.systemInstruction,
          searchGroundingEnabled: settings.searchGroundingEnabled,
          temperature: settings.temperature,
          memories: memoryTexts,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Ingress Failure: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let completedText = "";
      let citations: any[] = [];

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.substring(6).trim();
              if (dataStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  completedText += parsed.text;
                  // Incremental update in Firestore for clean real-time streaming bubbles!
                  await updateDoc(doc(db, "messages", assistantMessageRef.id), {
                    text: completedText,
                  });
                }
                if (parsed.citations) {
                  citations = parsed.citations;
                  await updateDoc(doc(db, "messages", assistantMessageRef.id), {
                    citations: citations,
                  });
                }
                if (parsed.error) {
                  completedText = `⚠️ Error: ${parsed.error}`;
                  await updateDoc(doc(db, "messages", assistantMessageRef.id), {
                    text: completedText,
                  });
                }
              } catch (e) {
                // partial json chunking lines can be ignored
              }
            }
          }
        }
      }

      // 7. Update assistant message with completed values and assign simulated tokens metadata
      await updateDoc(doc(db, "messages", assistantMessageRef.id), {
        text: completedText,
        tokensUsed: Math.floor(completedText.length / 4.5) + 30, // standard token approximation
      });

      // 8. Triggers autonomous long-term fact memory extraction
      triggerMemoryExtraction([...messagesToSend, { role: "model", text: completedText }]);

    } catch (err: any) {
      console.error("SendMessage error:", err);
      setIsGenerating(false);
      try {
        if (assistantMessageRef) {
          const errorMsg = err.message || "An unexpected error occurred.";
          const friendlyMsg = errorMsg.includes("HTTP Ingress Failure")
            ? `⚠️ Connection Error (${errorMsg}). Please verify that your backend server is running and your Gemini API Key is configured in Settings > Secrets.`
            : `⚠️ Connection Error: ${errorMsg}`;
          
          await updateDoc(doc(db, "messages", assistantMessageRef.id), {
            text: friendlyMsg,
          });
        }
      } catch (dbErr) {
        console.error("Failed to write error to Firestore:", dbErr);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Autonomous fact memory extraction pipeline
  const triggerMemoryExtraction = async (conversationThread: any[]) => {
    if (!user) return;

    try {
      const response = await fetch("/api/extract-memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationThread }),
      });

      if (response.ok) {
        const { memories: extracted } = await response.json();
        if (extracted && Array.isArray(extracted) && extracted.length > 0) {
          // Check for existing memories to prevent duplicates
          const currentMemoriesSnap = await getDocs(
            query(collection(db, "memories"), where("userId", "==", user.uid))
          );
          const currentMemoryContents = new Set<string>();
          currentMemoriesSnap.forEach((docSnap) => {
            currentMemoryContents.add(docSnap.data().content.toLowerCase());
          });

          for (const fact of extracted) {
            if (!currentMemoryContents.has(fact.toLowerCase())) {
              await addDoc(collection(db, "memories"), {
                userId: user.uid,
                content: fact,
                type: "long",
                importance: 3,
                createdAt: Date.now(),
              });
              
              // Trigger a beautiful visual alert on screen!
              setMemoryNotification(`AI Memorized: "${fact}"`);
              setTimeout(() => {
                setMemoryNotification(null);
              }, 4000);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to extract memories:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-800 font-sans select-none" id="loader_screen">
        <div className="p-3 bg-slate-100 rounded-2xl mb-4 text-slate-800 border border-slate-200">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-semibold tracking-tight text-slate-600">
          Authenticating container ingress...
        </p>
      </div>
    );
  }

  // Redirect to Sign In if not authenticated
  if (!user) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const activeTitle = activeConv ? activeConv.title : "New Discussion";

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-slate-850 select-none" id="app_workspace">
      
      {/* Real-time Memory extraction alert banner */}
      {memoryNotification && (
        <div className="fixed top-5 right-5 z-55 max-w-sm bg-white border border-slate-200 backdrop-blur-md rounded-xl p-4 shadow-lg flex gap-3 items-start animate-slide-in" id="memory_toast">
          <div className="p-1.5 bg-slate-100 text-slate-800 rounded-lg shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-slate-900">Memory Synchronized</h4>
            <p className="text-[11px] text-slate-500 leading-normal">{memoryNotification}</p>
          </div>
        </div>
      )}

      {/* Visual Navigation Column */}
      <Sidebar
        user={user}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMemory={() => setIsMemoryOpen(true)}
        onLogout={() => {}}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Workspace Frame */}
      <ChatInterface
        messages={messages}
        activeConversationTitle={activeTitle}
        onSendMessage={handleSendMessage}
        onReactToMessage={handleReactToMessage}
        settings={settings}
        isGenerating={isGenerating}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Settings Modal Sheet */}
      <SettingsPanelComponent
        settings={settings}
        onChange={(newSettings) => setSettings(newSettings)}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Long-Term Memory Vault Modal Sheet */}
      <MemoryPanel
        userId={user.uid}
        memories={memories}
        onMemoryAdded={() => {}}
        onMemoryDeleted={() => {}}
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />
    </div>
  );
}
