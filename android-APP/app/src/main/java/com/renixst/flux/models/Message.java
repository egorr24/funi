package com.renixst.flux.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class Message {
    @SerializedName("id")
    private String id;
    
    @SerializedName("chatId")
    private String chatId;
    
    @SerializedName("senderId")
    private String senderId;
    
    @SerializedName("senderName")
    private String senderName;
    
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
    
    @SerializedName("waveform")
    private String waveform;
    
    @SerializedName("status")
    private String status; // "SENT", "DELIVERED", "READ"
    
    @SerializedName("createdAt")
    private String createdAt;
    
    @SerializedName("replyTo")
    private Message replyTo;
    
    @SerializedName("reactions")
    private List<Reaction> reactions;

    public Message() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getChatId() {
        return chatId;
    }

    public void setChatId(String chatId) {
        this.chatId = chatId;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getEncryptedBody() {
        return encryptedBody;
    }

    public void setEncryptedBody(String encryptedBody) {
        this.encryptedBody = encryptedBody;
    }

    public String getEncryptedAes() {
        return encryptedAes;
    }

    public void setEncryptedAes(String encryptedAes) {
        this.encryptedAes = encryptedAes;
    }

    public String getIv() {
        return iv;
    }

    public void setIv(String iv) {
        this.iv = iv;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public String getWaveform() {
        return waveform;
    }

    public void setWaveform(String waveform) {
        this.waveform = waveform;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public Message getReplyTo() {
        return replyTo;
    }

    public void setReplyTo(Message replyTo) {
        this.replyTo = replyTo;
    }

    public List<Reaction> getReactions() {
        return reactions;
    }

    public void setReactions(List<Reaction> reactions) {
        this.reactions = reactions;
    }
}
