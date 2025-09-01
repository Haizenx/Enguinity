// src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const sorted = (res.data || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      set({ messages: sorted });
      return Promise.resolve();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
      return Promise.reject(error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Move a user to the top of the contacts list
  bumpUserToTop: (userId) => {
    set((state) => {
      const index = state.users.findIndex((u) => u._id === userId);
      if (index <= 0) return {};
      const usersCopy = state.users.slice();
      const [user] = usersCopy.splice(index, 1);
      return { users: [user, ...usersCopy] };
    });
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }
    
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      // Optimistically add the message to the UI
      set({ messages: [...messages, res.data] });
      // Move this conversation to the top of the contacts list
      get().bumpUserToTop(selectedUser._id);
    } catch (error) {
      console.error("Send message error:", error);
      toast.error(error.response?.data?.message || "Message failed to send");
    }
  },

  // This function should be called whenever a user is selected
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.log("❌ No socket available for message subscription");
      return;
    }

    console.log("📨 Subscribing to socket messages");

    // Remove any existing listeners to prevent duplicates
    socket.off("newMessage");

    // Add the new message listener
    socket.on("newMessage", (newMessage) => {
      console.log("📨 New message received in chat store:", newMessage);
      
      const { selectedUser } = get();
      const { authUser } = useAuthStore.getState();
      
      // Determine the other participant in the conversation
      const otherUserId = newMessage.senderId === authUser._id ? newMessage.receiverId : newMessage.senderId;

      // Reorder contacts in real-time
      const { users, getUsers, bumpUserToTop } = get();
      if (users && users.some((u) => u._id === otherUserId)) {
        bumpUserToTop(otherUserId);
      } else {
        // If the user is not in the list (e.g., new chat), refresh the users list
        getUsers();
      }
      
      // Add message if it's part of the current conversation
      const isRelevantMessage = selectedUser && (
        (newMessage.senderId === selectedUser._id && newMessage.receiverId === authUser._id) ||
        (newMessage.senderId === authUser._id && newMessage.receiverId === selectedUser._id)
      );

      if (isRelevantMessage) {
        console.log("📨 Adding message to current conversation");
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      } else {
        console.log("📨 Message not for current conversation, showing notification");
        // Show notification for messages not in current conversation
        if (newMessage.senderId !== authUser._id) {
          toast.success("New message received!");
        }
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      console.log("📨 Unsubscribing from socket messages");
      socket.off("newMessage");
    }
  },

  setSelectedUser: (selectedUser) => {
    console.log("👤 Setting selected user:", selectedUser?.fullName);

    const currentSelected = get().selectedUser;
    if (currentSelected?._id === selectedUser?._id) {
      // Clicking the same conversation again: do nothing to avoid clearing messages
      return;
    }
    
    // Unsubscribe from previous messages
    get().unsubscribeFromMessages();
    
    // Set the selected user and clear messages
    set({ selectedUser, messages: [] });
    
    // Subscribe to new messages after setting the user
    setTimeout(() => {
      get().subscribeToMessages();
    }, 100); // Small delay to ensure state is updated
  },
}));