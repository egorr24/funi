package com.renixst.flux.models;

import com.google.gson.annotations.SerializedName;
import java.util.Date;

public class Chat {
    @SerializedName("id")
    public String id;
    
    @SerializedName("title")
    public String title;
    
    @SerializedName("kind")
    public String kind; // "PERSONAL", "WORK", "AI", "CHANNEL"
    
    @SerializedName("is_pinned")
    public Boolean isPinned;
    
    @SerializedName("pinned_message_id")
    public String pinnedMessageId;
    
    @SerializedName("hls_manifest_url")
    public String hlsManifestUrl;
    
    @SerializedName("created_at")
    public Date createdAt;
    
    @SerializedName("updated_at")
    public Date updatedAt;

    public Chat() {}

    public Chat(String id, String title, String kind) {
        this.id = id;
        this.title = title;
        this.kind = kind;
    }
}
