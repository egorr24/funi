package com.renixst.flux.network;

import com.google.gson.annotations.SerializedName;
import com.renixst.flux.models.Chat;
import com.renixst.flux.models.Message;
import com.renixst.flux.models.User;
import java.util.List;

public class NetworkModels {
    
    public static class RegisterRequest {
        @SerializedName("email")
        private String email;
        
        @SerializedName("password")
        private String password;
        
        @SerializedName("name")
        private String name;

        public RegisterRequest(String email, String password, String name) {
            this.email = email;
            this.password = password;
            this.name = name;
        }

        public String getEmail() { return email; }
        public String getPassword() { return password; }
        public String getName() { return name; }
    }

    public static class LoginRequest {
        @SerializedName("email")
        private String email;
        
        @SerializedName("password")
        private String password;

        public LoginRequest(String email, String password) {
            this.email = email;
            this.password = password;
        }

        public String getEmail() { return email; }
        public String getPassword() { return password; }
    }

    public static class AuthResponse {
        @SerializedName("token")
        private String token;
        
        @SerializedName("user")
        private User user;

        public String getToken() { return token; }
        public User getUser() { return user; }
    }

    public static class CreateChatRequest {
        @SerializedName("title")
        private String title;
        
        @SerializedName("kind")
        private String kind;
        
        @SerializedName("memberIds")
        private List<String> memberIds;

        public CreateChatRequest(String title, String kind, List<String> memberIds) {
            this.title = title;
            this.kind = kind;
            this.memberIds = memberIds;
        }
    }

    public static class SendMessageRequest {
        @SerializedName("chatId")
        private String chatId;
        
        @SerializedName("encryptedBody")
        private String encryptedBody;
        
        @SerializedName("encryptedAes")
        private String encryptedAes;
        
        @SerializedName("iv")
        private String iv;
        
        @SerializedName("mediaUrl")
        private String mediaUrl;
        
        @SerializedName("mediaType")
        private String mediaType;
        
        @SerializedName("replyToId")
        private String replyToId;

        public SendMessageRequest(String chatId, String encryptedBody, String encryptedAes, String iv) {
            this.chatId = chatId;
            this.encryptedBody = encryptedBody;
            this.encryptedAes = encryptedAes;
            this.iv = iv;
        }
    }

    public static class ReactionRequest {
        @SerializedName("emoji")
        private String emoji;

        public ReactionRequest(String emoji) {
            this.emoji = emoji;
        }
    }

    public static class InitiateCallRequest {
        @SerializedName("receiverId")
        private String receiverId;
        
        @SerializedName("type")
        private String type;
        
        @SerializedName("chatId")
        private String chatId;

        public InitiateCallRequest(String receiverId, String type, String chatId) {
            this.receiverId = receiverId;
            this.type = type;
            this.chatId = chatId;
        }
    }

    public static class AnswerCallRequest {
        @SerializedName("sdpAnswer")
        private String sdpAnswer;

        public AnswerCallRequest(String sdpAnswer) {
            this.sdpAnswer = sdpAnswer;
        }
    }

    public static class UploadResponse {
        @SerializedName("url")
        private String url;
        
        @SerializedName("type")
        private String type;

        public String getUrl() { return url; }
        public String getType() { return type; }
    }

    public static class SearchResponse {
        @SerializedName("messages")
        private List<Message> messages;
        
        @SerializedName("chats")
        private List<Chat> chats;
        
        @SerializedName("users")
        private List<User> users;

        public List<Message> getMessages() { return messages; }
        public List<Chat> getChats() { return chats; }
        public List<User> getUsers() { return users; }
    }

    public static class CreateFolderRequest {
        @SerializedName("name")
        private String name;
        
        @SerializedName("color")
        private String color;

        public CreateFolderRequest(String name, String color) {
            this.name = name;
            this.color = color;
        }
    }

    public static class Folder {
        @SerializedName("id")
        private String id;
        
        @SerializedName("name")
        private String name;
        
        @SerializedName("color")
        private String color;
        
        @SerializedName("createdAt")
        private String createdAt;

        public String getId() { return id; }
        public String getName() { return name; }
        public String getColor() { return color; }
        public String getCreatedAt() { return createdAt; }
    }
}
