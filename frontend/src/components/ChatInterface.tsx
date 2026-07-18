import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { Send, Paperclip, Camera, Smile, X, FileText, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api, getMediaUrl } from "@/lib/api";
import { createChatClient, type ChatMessage } from "@/lib/ws";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";
import { cn } from "@/lib/utils";

interface Props {
  peerId: string;
  peerName: string;
  peerPictureUrl?: string | null;
}

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "😵‍💫", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"]
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾"]
  },
  {
    name: "Hearts & Symbols",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🌟", "⭐", "✨", "⚡", "💥", "🔥", "🌈", "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "💨", "🌊", "🎈", "🎉", "🎊", "🎁", "🏆"]
  },
  {
    name: "Fitness & Health",
    emojis: ["🏃", "🏃‍♀️", "🚶", "🚶‍♀️", "🏋️", "🏋️‍♀️", "🚴", "🚴‍♀️", "🧘", "🧘‍♀️", "🥗", "🍎", "🥑", "🍌", "🥦", "🥕", "🥤", "🥛", "🍵", "🥩", "🍗", "🥚", "🥣", "🍯", "💧", "💊", "🩹", "🩺", "⏱️", "🎯"]
  }
];

export function ChatInterface({ peerId, peerName, peerPictureUrl }: Props) {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const clientRef = useRef<Client | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // File attachments state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Emojis state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Camera capture state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [capturedFileUrl, setCapturedFileUrl] = useState<string | null>(null);
  const [capturedFileType, setCapturedFileType] = useState<"image" | "video" | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const recordingIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!token || !user || !peerId) return;
    api
      .get<ChatMessage[]>(`/chat/history/${peerId}`)
      .then((r) => setMessages(r.data ?? []))
      .catch(() => {
        // fallback deleted for real integration
      });

    const c = createChatClient(token, (m) => {
      // Use == to handle string vs number comparison
      if (String(m.senderId) === String(peerId) || String(m.receiverId) === String(peerId)) {
        setMessages((prev) => [...prev, m]);
      }
    });
    c.activate();
    clientRef.current = c;
    return () => {
      c.deactivate();
    };
  }, [peerId, token, user]);

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom("smooth");
    const timer1 = setTimeout(() => scrollToBottom("smooth"), 50);
    const timer2 = setTimeout(() => scrollToBottom("auto"), 200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [messages]);

  // Clean up camera streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, []);

  const send = async () => {
    const trimmedText = text.trim();
    if (!trimmedText && !selectedFile || !user || !peerId) return;

    let attachmentDetails = null;

    if (selectedFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        const uploadRes = await api.post("/chat/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        
        attachmentDetails = uploadRes.data;
      } catch (err) {
        console.error("Failed to upload file:", err);
        setUploading(false);
        alert("Failed to upload file. Please try again.");
        return;
      }
      setUploading(false);
      setSelectedFile(null);
      setFilePreviewUrl(null);
    }

    try {
      await api.post("/chat/send", {
        receiverId: peerId,
        content: trimmedText,
        attachmentUrl: attachmentDetails?.attachmentUrl || null,
        attachmentType: attachmentDetails?.attachmentType || null,
        attachmentName: attachmentDetails?.attachmentName || null,
      });
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // --- Camera Actions ---
  const startCamera = async () => {
    setCameraError(null);
    setCapturedFileUrl(null);
    setCapturedFileType(null);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      // Fallback: try video only if audio permission fails
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err2) {
        setCameraError("Could not access camera or microphone.");
      }
    }
  };

  const stopCamera = () => {
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsRecording(false);
    setRecordingTime(0);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Draw mirrored image if facing user
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setCapturedFileUrl(url);
        setCapturedFileType("image");
        (window as any)._tempCapturedFile = file;
      }
    }, "image/jpeg", 0.9);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    recordedChunksRef.current = [];
    let options = { mimeType: "video/webm;codecs=vp9,opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm;codecs=vp8,opus" };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm" };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "" };
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/mp4" });
        const file = new File([blob], `camera_${Date.now()}.mp4`, { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        setCapturedFileUrl(url);
        setCapturedFileType("video");
        (window as any)._tempCapturedFile = file;
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start duration limit (10s)
      const startTime = Date.now();
      recordingIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setRecordingTime(Math.min(elapsed, 10));
      }, 100);

      recordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 10000); // 10 seconds limit
      
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      alert("Video recording is not supported on this browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  };

  const retakeCamera = () => {
    setCapturedFileUrl(null);
    setCapturedFileType(null);
    (window as any)._tempCapturedFile = null;
    startCamera();
  };

  const acceptCameraCapture = () => {
    const file = (window as any)._tempCapturedFile;
    if (file) {
      setSelectedFile(file);
      setFilePreviewUrl(capturedFileUrl);
    }
    stopCamera();
  };

  // --- File input actions ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  // --- Emojis actions ---
  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatMessageDate = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    }
  };

  if (!peerId) {
    return (
      <Card className="flex h-[400px] items-center justify-center p-6 text-center border border-border/80 shadow-md rounded-2xl bg-card/50 backdrop-blur-sm">
        <div>
          <p className="text-lg font-bold text-muted-foreground">No coach assigned yet.</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Once your Alaya Master Coach is assigned, you can start messaging them directly here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative flex h-full w-full flex-col overflow-hidden p-0 border border-border/80 shadow-lg rounded-2xl bg-card/65 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/50 bg-gradient-soft px-4 py-3 shrink-0">
        <div className="relative h-10 w-10 shrink-0">
          {peerPictureUrl ? (
            <img
              src={getMediaUrl(peerPictureUrl)}
              alt={peerName}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/30 shadow-glow shadow-primary/20"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-white shadow-glow shadow-primary/20">
              {peerName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background animate-pulse" />
        </div>
        <div>
          <p className="text-sm md:text-base font-bold tracking-tight text-foreground truncate">{peerName}</p>
          <div className="flex items-center gap-1">
            <p className="text-[10px] md:text-xs text-primary/95 font-bold uppercase tracking-wider">
              Personal Accountability Coach
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area with Locked Background */}
      <div className="relative flex-1 overflow-hidden bg-background/30 dark:bg-card/10">
        {/* Fixed Background Image Overlay */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-[0.06] dark:opacity-[0.03] select-none mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Scrollable messages container */}
        <div
          ref={scrollRef}
          className="absolute inset-0 z-10 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar"
        >
          <AnimatePresence initial={false}>
            {messages.map((m, i) => {
              const mine = String(m.senderId) === String(user?.id);
              const showDateDivider =
                i === 0 ||
                new Date(messages[i].timestamp).toDateString() !==
                  new Date(messages[i - 1].timestamp).toDateString();

              return (
                <div key={m.id ?? `${m.timestamp}-${i}`} className="space-y-4">
                  {/* Date Divider */}
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-6">
                      <span className="rounded-full bg-muted/80 backdrop-blur-sm px-3.5 py-1 text-[10px] md:text-xs font-bold text-muted-foreground/90 uppercase tracking-widest border border-border/40 shadow-sm">
                        {formatMessageDate(m.timestamp)}
                      </span>
                    </div>
                  )}

                  {/* Message Row */}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={cn("flex items-end gap-2.5", mine ? "justify-end" : "justify-start")}
                  >
                    {/* Peer Avatar on Incoming Messages */}
                    {!mine && (
                      peerPictureUrl ? (
                        <img
                          src={getMediaUrl(peerPictureUrl)}
                          alt={peerName}
                          className="h-7 w-7 md:h-8 md:w-8 shrink-0 rounded-full object-cover border border-border/80 shadow-inner"
                        />
                      ) : (
                        <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 select-none items-center justify-center rounded-full bg-gradient-soft border border-border/80 text-[10px] md:text-xs font-black text-primary shadow-inner">
                          {peerName.slice(0, 2).toUpperCase()}
                        </div>
                      )
                    )}

                    {/* Spacer to align outgoing messages — own avatar shown after bubble */}

                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "max-w-[85%] md:max-w-[68%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all hover:shadow-md",
                        mine
                          ? "rounded-br-sm bg-gradient-brand text-white shadow-primary/10"
                          : "rounded-bl-sm bg-card/90 dark:bg-card/70 text-foreground border border-border/50 backdrop-blur-xs"
                      )}
                    >
                      {/* Message text */}
                      {m.content && <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>}

                      {/* Attachment Rendering */}
                      {m.attachmentUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-border/30 bg-muted/20 max-w-full">
                          {m.attachmentType?.startsWith("image/") ? (
                            <a href={getMediaUrl(m.attachmentUrl)} target="_blank" rel="noopener noreferrer">
                              <img
                                src={getMediaUrl(m.attachmentUrl)}
                                alt={m.attachmentName}
                                onLoad={() => scrollToBottom("auto")}
                                className="max-h-60 w-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                              />
                            </a>
                          ) : m.attachmentType?.startsWith("video/") ? (
                            <video
                              src={getMediaUrl(m.attachmentUrl)}
                              controls
                              onLoadedData={() => scrollToBottom("auto")}
                              className="max-h-60 w-full object-contain bg-black"
                            />
                          ) : (
                            <div className="flex items-center gap-3 p-3 text-xs md:text-sm text-left">
                              <FileText className={cn("h-8 w-8 shrink-0", mine ? "text-white" : "text-primary")} />
                              <div className="flex-1 overflow-hidden">
                                <p className="font-semibold truncate">{m.attachmentName}</p>
                                <p className={cn("text-[10px] uppercase opacity-80", mine ? "text-white/80" : "text-muted-foreground")}>
                                  {m.attachmentType?.split("/")[1] || "File"}
                                </p>
                              </div>
                              <a
                                href={getMediaUrl(m.attachmentUrl)}
                                download={m.attachmentName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn("p-2 rounded-full shrink-0 transition-colors", mine ? "hover:bg-white/20 text-white" : "hover:bg-muted text-primary")}
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        className={cn(
                          "mt-1.5 flex items-center justify-end gap-1 text-[9px] md:text-[10px] font-bold tracking-wide uppercase",
                          mine ? "text-white/75" : "text-muted-foreground/75"
                        )}
                      >
                        <span>
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {mine && (
                          <span className="flex text-[9px] font-bold">
                            <span>✓</span>
                            {m.read && <span className="-ml-0.5">✓</span>}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Own Avatar on Outgoing Messages */}
                    {mine && (
                      user?.profilePictureUrl ? (
                        <img
                          src={getMediaUrl(user.profilePictureUrl)}
                          alt={user.name}
                          className="h-7 w-7 md:h-8 md:w-8 shrink-0 rounded-full object-cover border border-border/80 shadow-inner"
                        />
                      ) : (
                        <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 select-none items-center justify-center rounded-full bg-gradient-brand text-[10px] md:text-xs font-black text-white shadow-inner">
                          {user?.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )
                    )}
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Form Input Section */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="relative z-20 flex flex-col border-t border-border/50 bg-card/95 backdrop-blur-md p-2 md:p-3 shrink-0"
      >
        {/* Selected file preview row */}
        {selectedFile && (
          <div className="flex items-center justify-between gap-2 bg-muted/80 backdrop-blur-sm rounded-lg p-2 mb-2 border border-border/30 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2 overflow-hidden">
              {filePreviewUrl && selectedFile.type.startsWith("image/") ? (
                <img src={filePreviewUrl} className="h-10 w-10 object-cover rounded-md" />
              ) : filePreviewUrl && selectedFile.type.startsWith("video/") ? (
                <div className="h-10 w-10 bg-black flex items-center justify-center rounded-md text-white text-[8px] font-bold border border-border/30">
                  VIDEO
                </div>
              ) : (
                <div className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-md">
                  <FileText className="h-5 w-5" />
                </div>
              )}
              <div className="text-left overflow-hidden">
                <p className="text-xs font-semibold truncate text-foreground">{selectedFile.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSelectedFile(null);
                setFilePreviewUrl(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Input Controls Row */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Files trigger */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 md:h-11 md:w-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 shrink-0 transition-colors"
            title="Attach a file"
          >
            <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          {/* Camera trigger */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowCamera(true);
              startCamera();
            }}
            className="h-9 w-9 md:h-11 md:w-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 shrink-0 transition-colors"
            title="Capture photo or video"
          >
            <Camera className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          {/* Emoji trigger */}
          <div className="relative shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn(
                "h-9 w-9 md:h-11 md:w-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors",
                showEmojiPicker && "text-primary bg-primary/10"
              )}
              title="Add emoji"
            >
              <Smile className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            {/* Emoji Picker Dropdown */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-72 max-w-[calc(100vw-32px)] border border-border/80 rounded-2xl bg-card/95 backdrop-blur-md shadow-2xl p-3 text-left">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
                  <span className="text-xs font-bold text-muted-foreground">Select Emoji</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-full"
                    onClick={() => setShowEmojiPicker(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="h-48 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {EMOJI_CATEGORIES.map((category) => (
                    <div key={category.name}>
                      <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">
                        {category.name}
                      </p>
                      <div className="grid grid-cols-7 gap-1">
                        {category.emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiClick(emoji)}
                            className="text-lg md:text-xl p-1 rounded hover:bg-muted transition-colors active:scale-90"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            disabled={uploading}
            className="flex-1 text-sm h-10 md:h-11 px-3 md:px-4 rounded-xl border border-border/80 bg-background/50 focus-visible:ring-primary focus-visible:ring-1 focus-visible:border-primary transition-all duration-200"
          />

          <Button
            type="submit"
            size="icon"
            disabled={uploading || (!text.trim() && !selectedFile)}
            className="h-9 w-9 md:h-11 md:w-11 rounded-xl bg-gradient-brand text-white hover:opacity-95 shadow-md shadow-primary/20 shrink-0 transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {uploading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>
        </div>
      </form>

      {/* Camera Capture Overlay (Renders on top of the chat area) */}
      {showCamera && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between text-white shrink-0">
            <h3 className="text-sm font-bold tracking-tight">Camera Access</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-full h-8 w-8"
              onClick={stopCamera}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Camera / Preview Viewport */}
          <div className="flex-1 my-4 relative rounded-2xl overflow-hidden bg-zinc-950 flex items-center justify-center border border-zinc-800">
            {cameraError ? (
              <div className="p-6 text-center">
                <p className="text-sm text-red-500 font-bold">{cameraError}</p>
                <p className="text-xs text-zinc-400 mt-2">
                  Please make sure you have given camera permissions to this site.
                </p>
              </div>
            ) : capturedFileUrl ? (
              // Captured preview
              capturedFileType === "image" ? (
                <img src={capturedFileUrl} className="w-full h-full object-contain" />
              ) : (
                <video src={capturedFileUrl} controls autoPlay loop className="w-full h-full object-contain" />
              )
            ) : (
              // Live camera stream
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {isRecording && (
                  <div className="absolute top-4 left-4 bg-red-600/90 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-white" />
                    <span>REC {recordingTime.toFixed(1)}s / 10s</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 items-center shrink-0">
            {capturedFileUrl ? (
              // Accept or retake controls
              <div className="flex items-center gap-3 w-full max-w-xs mb-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 text-white border-zinc-700 bg-transparent hover:bg-zinc-900 rounded-xl text-xs"
                  onClick={retakeCamera}
                >
                  Retake
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-gradient-brand text-white hover:opacity-90 rounded-xl text-xs"
                  onClick={acceptCameraCapture}
                >
                  Use Media
                </Button>
              </div>
            ) : (
              // Live controls
              <div className="flex items-center justify-center gap-8 w-full mb-2">
                {/* Photo Capture */}
                {!isRecording && (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                  >
                    <div className="h-12 w-12 rounded-full border-4 border-white bg-transparent flex items-center justify-center p-0.5 active:scale-95 transition-transform">
                      <div className="h-full w-full rounded-full bg-white" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Photo</span>
                  </button>
                )}

                {/* Video Recording */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="flex flex-col items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                >
                  <div className={cn(
                    "h-12 w-12 rounded-full border-4 border-white bg-transparent flex items-center justify-center p-0.5 active:scale-95 transition-transform",
                    isRecording ? "border-red-600" : "border-white"
                  )}>
                    <div className={cn(
                      "h-full w-full rounded-full transition-all duration-300",
                      isRecording ? "bg-red-600 rounded-md scale-60" : "bg-red-600"
                    )} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {isRecording ? "Stop" : "Video"}
                  </span>
                </button>
              </div>
            )}
            <p className="text-[9px] text-zinc-500 text-center max-w-xs mb-1">
              Videos are limited to 10 seconds.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
