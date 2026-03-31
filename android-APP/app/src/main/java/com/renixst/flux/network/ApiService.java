package com.renixst.flux.network;

import com.renixst.flux.models.*;
import com.renixst.flux.network.NetworkModels.*;
import retrofit2.Call;
import retrofit2.http.*;
import java.util.List;
import java.util.Map;

public interface ApiService {
    
    // Auth endpoints
    @POST("api/register")
    Call<AuthResponse> register(@Body RegisterRequest request);
    
    @POST("api/login")
    Call<AuthResponse> login(@Body LoginRequest request);
    
    @POST("api/auth/logout")
    Call<Void> logout(@Header("Authorization") String token);
    
    // Users endpoints
    @GET("api/users")
    Call<List<User>> getUsers(@Header("Authorization") String token);
    
    @GET("api/users/{id}")
    Call<User> getUser(@Path("id") String userId, @Header("Authorization") String token);
    
    @PUT("api/users/{id}")
    Call<User> updateUser(@Path("id") String userId, @Body User user, @Header("Authorization") String token);
    
    @POST("api/users/search")
    Call<List<User>> searchUsers(@Query("q") String query, @Header("Authorization") String token);
    
    // Chats endpoints
    @GET("api/chats")
    Call<List<Chat>> getChats(@Header("Authorization") String token);
    
    @POST("api/chats")
    Call<Chat> createChat(@Body CreateChatRequest request, @Header("Authorization") String token);
    
    @GET("api/chats/{id}")
    Call<Chat> getChat(@Path("id") String chatId, @Header("Authorization") String token);
    
    @PUT("api/chats/{id}")
    Call<Chat> updateChat(@Path("id") String chatId, @Body Chat chat, @Header("Authorization") String token);
    
    @DELETE("api/chats/{id}")
    Call<Void> deleteChat(@Path("id") String chatId, @Header("Authorization") String token);
    
    // Messages endpoints
    @GET("api/messages")
    Call<List<Message>> getMessages(@Query("chatId") String chatId, @Header("Authorization") String token);
    
    @POST("api/messages")
    Call<Message> sendMessage(@Body SendMessageRequest request, @Header("Authorization") String token);
    
    @GET("api/messages/{id}")
    Call<Message> getMessage(@Path("id") String messageId, @Header("Authorization") String token);
    
    @DELETE("api/messages/{id}")
    Call<Void> deleteMessage(@Path("id") String messageId, @Header("Authorization") String token);
    
    @POST("api/messages/{id}/reactions")
    Call<Reaction> addReaction(@Path("id") String messageId, @Body ReactionRequest request, @Header("Authorization") String token);
    
    @DELETE("api/messages/{id}/reactions/{reactionId}")
    Call<Void> removeReaction(@Path("id") String messageId, @Path("reactionId") String reactionId, @Header("Authorization") String token);
    
    @POST("api/messages/{id}/read")
    Call<Void> markMessageAsRead(@Path("id") String messageId, @Header("Authorization") String token);
    
    // Calls endpoints
    @POST("api/calls")
    Call<Call> initiateCall(@Body InitiateCallRequest request, @Header("Authorization") String token);
    
    @GET("api/calls/{id}")
    Call<Call> getCall(@Path("id") String callId, @Header("Authorization") String token);
    
    @POST("api/calls/{id}/answer")
    Call<Call> answerCall(@Path("id") String callId, @Body AnswerCallRequest request, @Header("Authorization") String token);
    
    @POST("api/calls/{id}/reject")
    Call<Void> rejectCall(@Path("id") String callId, @Header("Authorization") String token);
    
    @POST("api/calls/{id}/end")
    Call<Void> endCall(@Path("id") String callId, @Header("Authorization") String token);
    
    // File upload
    @Multipart
    @POST("api/upload")
    Call<UploadResponse> uploadFile(@Part("file") okhttp3.RequestBody file, @Header("Authorization") String token);
    
    // Search
    @GET("api/search")
    Call<SearchResponse> search(@Query("q") String query, @Header("Authorization") String token);
    
    // Folders endpoints
    @GET("api/folders")
    Call<List<Folder>> getFolders(@Header("Authorization") String token);
    
    @POST("api/folders")
    Call<Folder> createFolder(@Body CreateFolderRequest request, @Header("Authorization") String token);
    
    @PUT("api/folders/{id}")
    Call<Folder> updateFolder(@Path("id") String folderId, @Body Folder folder, @Header("Authorization") String token);
    
    @DELETE("api/folders/{id}")
    Call<Void> deleteFolder(@Path("id") String folderId, @Header("Authorization") String token);
}
