package com.renixst.flux.models;

import com.google.gson.annotations.SerializedName;

public class Reaction {
    @SerializedName("id")
    private String id;
    
    @SerializedName("messageId")
    private String messageId;
    
    @SerializedName("userId")
    private String userId;
    
    @SerializedName("userName")
    private String userName;
    
    @SerializedName("emoji")
    private String emoji;
    
    @SerializedName("createdAt")
    private String createdAt;

    public Reaction() {
    }

    public Reaction(String messageId, String userId, String emoji) {
        this.messageId = messageId;
        this.userId = userId;
        this.emoji = emoji;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getEmoji() {
        return emoji;
    }

    public void setEmoji(String emoji) {
        this.emoji = emoji;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
