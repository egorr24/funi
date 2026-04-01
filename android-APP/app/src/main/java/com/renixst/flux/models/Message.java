package com.renixst.flux.models;

import com.google.gson.annotations.SerializedName;
import java.util.Date;

public class Message {
    @SerializedName("id")
    public String id;
    
    @SerializedName("chat_id")
    public String chatId;
    
    @SerializedName("sender_id")
    public String senderId;
    
    @SerializedName("sender_name")
    public String senderName;
    
    @SerializedName("sender_avatar")
    public String senderAvatar;
    
    @SerializedName("encrypted_body")
    public String encryptedBody;
    
    @SerializedName("encrypted_aes")
    public String encryptedAes;
    
    @SerializedName("iv")
    public String iv;
    
    @SerializedName("media_url")
    public String mediaUrl;
    
    @SerializedName("media_type")
    public String mediaType; // "image", "video", "audio", "file"
    
    @SerializedName("waveform")
    public String waveform;
    
    @SerializedName("reply_to_id")
    public String replyToId;
    
    @SerializedName("created_at")
    public Date createdAt;
    
    @SerializedName("updated_at")
    public Date updatedAt;

    public Message() {}

    public Message(String chatId, String senderId, String encryptedBody, String encryptedAes, String iv) {
        this.chatId = chatId;
        this.senderId = senderId;
        this.encryptedBody = encryptedBody;
        this.encryptedAes = encryptedAes;
        this.iv = iv;
    }
}
