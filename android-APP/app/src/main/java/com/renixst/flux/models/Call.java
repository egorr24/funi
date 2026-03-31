package com.renixst.flux.models;

import com.google.gson.annotations.SerializedName;

public class Call {
    @SerializedName("id")
    private String id;
    
    @SerializedName("callerId")
    private String callerId;
    
    @SerializedName("callerName")
    private String callerName;
    
    @SerializedName("callerAvatar")
    private String callerAvatar;
    
    @SerializedName("receiverId")
    private String receiverId;
    
    @SerializedName("receiverName")
    private String receiverName;
    
    @SerializedName("receiverAvatar")
    private String receiverAvatar;
    
    @SerializedName("chatId")
    private String chatId;
    
    @SerializedName("type")
    private String type; // "VOICE", "VIDEO"
    
    @SerializedName("status")
    private String status; // "RINGING", "CONNECTING", "ACTIVE", "ENDED", "REJECTED"
    
    @SerializedName("startedAt")
    private String startedAt;
    
    @SerializedName("endedAt")
    private String endedAt;
    
    @SerializedName("sdpOffer")
    private String sdpOffer;
    
    @SerializedName("sdpAnswer")
    private String sdpAnswer;

    public Call() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCallerId() {
        return callerId;
    }

    public void setCallerId(String callerId) {
        this.callerId = callerId;
    }

    public String getCallerName() {
        return callerName;
    }

    public void setCallerName(String callerName) {
        this.callerName = callerName;
    }

    public String getCallerAvatar() {
        return callerAvatar;
    }

    public void setCallerAvatar(String callerAvatar) {
        this.callerAvatar = callerAvatar;
    }

    public String getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(String receiverId) {
        this.receiverId = receiverId;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public String getReceiverAvatar() {
        return receiverAvatar;
    }

    public void setReceiverAvatar(String receiverAvatar) {
        this.receiverAvatar = receiverAvatar;
    }

    public String getChatId() {
        return chatId;
    }

    public void setChatId(String chatId) {
        this.chatId = chatId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(String startedAt) {
        this.startedAt = startedAt;
    }

    public String getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(String endedAt) {
        this.endedAt = endedAt;
    }

    public String getSdpOffer() {
        return sdpOffer;
    }

    public void setSdpOffer(String sdpOffer) {
        this.sdpOffer = sdpOffer;
    }

    public String getSdpAnswer() {
        return sdpAnswer;
    }

    public void setSdpAnswer(String sdpAnswer) {
        this.sdpAnswer = sdpAnswer;
    }
}
