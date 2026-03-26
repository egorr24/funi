package com.flux.app;

import java.util.List;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface ApiService {
    
    @POST("api/register")
    Call<AuthResponse> register(@Body RegisterRequest request);
    
    @POST("api/auth/callback/credentials") 
    Call<AuthResponse> login(@Body LoginRequest request);

    @GET("api/chats")
    Call<List<ChatResponse>> getChats(@Query("userId") String userId);

    @GET("api/messages")
    Call<List<MessageResponse>> getMessages(@Query("chatId") String chatId);

    class RegisterRequest {
        String name, email, password;
        RegisterRequest(String n, String e, String p) { name = n; email = e; password = p; }
    }

    class LoginRequest {
        String email, password;
        LoginRequest(String e, String p) { email = e; password = p; }
    }

    class AuthResponse {
        boolean ok;
        User user;
        String error;
    }

    class User {
        String id, name, email;
    }

    class ChatResponse {
        String id, title, avatar, kind, lastMessagePreview;
        int unreadCount;
    }

    class MessageResponse {
        String id, body, senderId, senderName, mediaUrl, mediaType;
        boolean isSecure;
        long createdAt;
    }
}
