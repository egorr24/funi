package com.renixst.flux.models;

import com.google.gson.annotations.SerializedName;
import java.util.Date;

public class User {
    @SerializedName("id")
    public String id;
    
    @SerializedName("name")
    public String name;
    
    @SerializedName("email")
    public String email;
    
    @SerializedName("avatar")
    public String avatar;
    
    @SerializedName("status")
    public String status; // "online", "offline"
    
    @SerializedName("last_seen")
    public Date lastSeen;
    
    @SerializedName("public_key")
    public String publicKey;
    
    @SerializedName("created_at")
    public Date createdAt;
    
    @SerializedName("updated_at")
    public Date updatedAt;

    public User() {}

    public User(String id, String name, String email, String avatar, String status) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.avatar = avatar;
        this.status = status;
    }
}
