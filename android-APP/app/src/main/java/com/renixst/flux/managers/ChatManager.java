package com.renixst.flux.managers;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ChatManager {
    private static final String PREF_NAME = "flux_chats_prefs";
    private static final String KEY_UNREAD_CHATS = "unread_chats";
    
    private SharedPreferences pref;

    public ChatManager(Context context) {
        this.pref = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public void markChatAsRead(String chatId) {
        Set<String> unreadChats = new HashSet<>(pref.getStringSet(KEY_UNREAD_CHATS, new HashSet<>()));
        unreadChats.remove(chatId);
        
        SharedPreferences.Editor editor = pref.edit();
        editor.putStringSet(KEY_UNREAD_CHATS, unreadChats);
        editor.apply();
    }

    public void markChatAsUnread(String chatId) {
        Set<String> unreadChats = new HashSet<>(pref.getStringSet(KEY_UNREAD_CHATS, new HashSet<>()));
        unreadChats.add(chatId);
        
        SharedPreferences.Editor editor = pref.edit();
        editor.putStringSet(KEY_UNREAD_CHATS, unreadChats);
        editor.apply();
    }

    public List<String> getUnreadChats() {
        Set<String> unreadChats = pref.getStringSet(KEY_UNREAD_CHATS, new HashSet<>());
        return new ArrayList<>(unreadChats);
    }

    public int getUnreadCount() {
        return getUnreadChats().size();
    }

    public boolean isUnread(String chatId) {
        Set<String> unreadChats = pref.getStringSet(KEY_UNREAD_CHATS, new HashSet<>());
        return unreadChats.contains(chatId);
    }
}
