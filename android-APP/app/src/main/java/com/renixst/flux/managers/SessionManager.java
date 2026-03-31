package com.renixst.flux.managers;

import android.content.Context;
import android.content.SharedPreferences;
import com.renixst.flux.models.User;
import com.google.gson.Gson;

public class SessionManager {
    private static final String PREF_NAME = "flux_prefs";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER = "user";
    private static final String KEY_USER_ID = "user_id";
    
    private SharedPreferences pref;
    private Gson gson = new Gson();

    public SessionManager(Context context) {
        this.pref = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public void saveSession(String token, User user) {
        SharedPreferences.Editor editor = pref.edit();
        editor.putString(KEY_TOKEN, token);
        editor.putString(KEY_USER, gson.toJson(user));
        editor.putString(KEY_USER_ID, user.getId());
        editor.apply();
    }

    public String getToken() {
        return pref.getString(KEY_TOKEN, null);
    }

    public User getUser() {
        String userJson = pref.getString(KEY_USER, null);
        if (userJson != null) {
            return gson.fromJson(userJson, User.class);
        }
        return null;
    }

    public String getUserId() {
        return pref.getString(KEY_USER_ID, null);
    }

    public void clearSession() {
        SharedPreferences.Editor editor = pref.edit();
        editor.clear();
        editor.apply();
    }

    public boolean isLoggedIn() {
        return getToken() != null && getUser() != null;
    }

    public void updateUser(User user) {
        SharedPreferences.Editor editor = pref.edit();
        editor.putString(KEY_USER, gson.toJson(user));
        editor.apply();
    }
}
