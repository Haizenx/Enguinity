// src/components/ChatContainer.js
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import MessageSkeleton from "./skeletons/MessageSkeleton";

const ChatContainer = () => {
    const { messages, getMessages, isMessagesLoading, selectedUser, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [lightboxImage, setLightboxImage] = useState(null);

    useEffect(() => {
        if (selectedUser?._id) {
            getMessages(selectedUser._id);
            subscribeToMessages();
        }
        return () => unsubscribeFromMessages();
    }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        }
    }, [messages, selectedUser?._id]);


    // This loading state is now properly contained
    if (isMessagesLoading) {
        return (
            <div className='flex-1 flex flex-col min-h-0'>
                <ChatHeader />
                <MessageSkeleton />
                <MessageInput />
            </div>
        );
    }

    return (
        // This structure is correct for internal scrolling.
        <div className='flex-1 flex flex-col min-h-0'>
            {/* Header (fixed height) */}
            <div className="flex-shrink-0">
                <ChatHeader />
            </div>

            {/* THE SCROLLABLE AREA */}
            <div ref={messagesContainerRef} className='flex-1 overflow-y-auto p-4 space-y-4'>
                {messages.map((message) => (
                    <div
                        key={message._id}
                        className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                    >
                        {/* Your Message Structure */}
                        <div className="chat-image avatar">
                          <div className="size-10 rounded-full border">
                            <img src={message.senderId === authUser._id ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"} alt="profile pic" />
                          </div>
                        </div>
                        <div className="chat-header mb-1">
                          <time className="text-xs opacity-50 ml-1">{formatMessageTime(message.createdAt)}</time>
                        </div>
                        <div className="chat-bubble flex flex-col">
                          {message.image && (
                            <img
                                src={message.image}
                                alt="Attachment"
                                className="sm:max-w-[200px] rounded-md mb-2 cursor-zoom-in"
                                onClick={() => setLightboxImage(message.image)}
                            />
                          )}
                          {message.text && <p>{message.text}</p>}
                        </div>
                    </div>
                ))}
                <div ref={messageEndRef} />
            </div>

            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <img
                        src={lightboxImage}
                        alt="Full size attachment"
                        className="max-h-[90vh] max-w-[90vw] rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        className="absolute top-4 right-4 btn btn-sm"
                        onClick={() => setLightboxImage(null)}
                    >
                        Close
                    </button>
                </div>
            )}

            {/* Input (fixed height) */}
            <div className="flex-shrink-0">
                <MessageInput />
            </div>
        </div>
    );
};

export default ChatContainer;