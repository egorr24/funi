package com.renixst.flux.api;

import com.renixst.flux.models.User;
import com.renixst.flux.models.Chat;
import com.renixst.flux.models.Message;
import retrofit2.Call;
import retrofit2.http.*;

import java.util.List;
import java.util.Map;

public interface ApiService {
    
    // ============ Auth Endpoints ============
    
    @POST("auth/register")
    Call<AuthResponse> register(@Body RegisterRequest body);
    
    @POST("auth/login")
    Call<AuthResponse> login(@Body LoginRequest body);
    
    @GET("auth/me")
    Call<User> getCurrentUser();
    
    @PUT("auth/profile")
    Call<User> updateProfile(@Body Map<String, String> body);
    
    @POST("auth/logout")
    Call<Void> logout();
    
    @POST("auth/refresh")
    Call<AuthResponse> refreshToken(@Body Map<String, String> body);
    
    // ============ Users Endpoints ============
    
    @GET("users/search")
    Call<List<User>> searchUsers(@Query("q") String query);
    
    @GET("users/{id}")
    Call<User> getUser(@Path("id") String userId);
    
    @PUT("users/status")
    Call<User> updateUserStatus(@Body Map<String, String> body);
    
    // ============ Chats Endpoints ============
    
    @GET("chats")
    Call<List<Chat>> getChats();
    
    @POST("chats")
    Call<Chat> createChat(@Body Map<String, String> body);
    
    @GET("chats/{id}")
    Call<Chat> getChat(@Path("id") String chatId);
    
    @GET("chats/{id}/members")
    Call<List<User>> getChatMembers(@Path("id") String chatId);
    
    @POST("chats/{id}/members")
    Call<Void> addChatMember(@Path("id") String chatId, @Body Map<String, String> body);
    
    // ============ Messages Endpoints ============
    
    @GET("messages")
    Call<List<Message>> getMessages(@Query("chatId") String chatId, @Query("limit") int limit, @Query("offset") int offset);
    
    @POST("messages")
    Call<Message> sendMessage(@Body Message message);
    
    @GET("messages/{id}")
    Call<Message> getMessage(@Path("id") String messageId);
    
    @DELETE("messages/{id}")
    Call<Void> deleteMessage(@Path("id") String messageId);
    
    @PUT("messages/{id}/read")
    Call<Void> markMessageAsRead(@Path("id") String messageId);
    
    // ============ Calls Endpoints ============
    
    @POST("calls/initiate")
    Call<CallResponse> initiateCall(@Body Map<String, String> body);
    
    @PUT("calls/{callId}/answer")
    Call<CallResponse> answerCall(@Path("callId") String callId, @Body Map<String, String> body);
    
    @PUT("calls/{callId}/end")
    Call<CallResponse> endCall(@Path("callId") String callId, @Body Map<String, String> body);
    
    @GET("calls/history")
    Call<List<CallHistory>> getCallHistory();
    
    @GET("calls/active")
    Call<List<CallResponse>> getActiveCalls();
    
    // ============ Response Models ============
    
    class AuthResponse {
        public User user;
        public String accessToken;
        public String refreshToken;
        public long expiresIn;
    }
    
    class RegisterRequest {
        public String username;
        public String email;
        public String password;
        public String displayName;
    }
    
    class LoginRequest {
        public String email;
        public String password;
    }
    
    class CallResponse {
        public String id;
        public String initiatorId;
        public String receiverId;
        public String status; // "pending", "accepted", "ended"
        public String mediaUrl;
        public long timestamp;
    }
    
    class CallHistory {
        public String id;
        public String participantId;
        public String participantName;
        public long duration;
        public String status;
        public long createdAt;
    }
}
