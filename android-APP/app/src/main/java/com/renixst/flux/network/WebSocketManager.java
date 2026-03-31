package com.renixst.flux.network;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.renixst.flux.models.Message;
import java.util.ArrayList;
import java.util.List;

public class WebSocketManager {
    private static WebSocketManager instance;
    private WebSocket webSocket;
    private final OkHttpClient client = new OkHttpClient();
    private final Gson gson = new Gson();
    
    private List<MessageListener> messageListeners = new ArrayList<>();
    private List<ConnectionListener> connectionListeners = new ArrayList<>();
    
    public interface MessageListener {
        void onNewMessage(Message message);
        void onReaction(JsonObject reaction);
        void onTyping(String userId);
    }
    
    public interface ConnectionListener {
        void onConnected();
        void onDisconnected();
        void onError(String error);
    }
    
    public static WebSocketManager getInstance() {
        if (instance == null) {
            instance = new WebSocketManager();
        }
        return instance;
    }
    
    public void connect(String wsUrl, String token) {
        String url = wsUrl.replace("http", "ws") + "?token=" + token;
        Request request = new Request.Builder().url(url).build();
        
        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, okhttp3.Response response) {
                for (ConnectionListener listener : connectionListeners) {
                    listener.onConnected();
                }
            }
            
            @Override
            public void onMessage(WebSocket webSocket, String text) {
                try {
                    JsonObject json = gson.fromJson(text, JsonObject.class);
                    String type = json.get("type").getAsString();
                    
                    switch (type) {
                        case "message":
                            Message msg = gson.fromJson(json.get("data"), Message.class);
                            for (MessageListener listener : messageListeners) {
                                listener.onNewMessage(msg);
                            }
                            break;
                        case "reaction":
                            for (MessageListener listener : messageListeners) {
                                listener.onReaction(json.getAsJsonObject("data"));
                            }
                            break;
                        case "typing":
                            String userId = json.get("data").getAsJsonObject().get("userId").getAsString();
                            for (MessageListener listener : messageListeners) {
                                listener.onTyping(userId);
                            }
                            break;
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            
            @Override
            public void onFailure(WebSocket webSocket, Throwable t, okhttp3.Response response) {
                for (ConnectionListener listener : connectionListeners) {
                    listener.onError(t.getMessage());
                }
            }
            
            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                for (ConnectionListener listener : connectionListeners) {
                    listener.onDisconnected();
                }
            }
        });
    }
    
    public void disconnect() {
        if (webSocket != null) {
            webSocket.close(1000, "Closing");
        }
    }
    
    public void send(String message) {
        if (webSocket != null) {
            webSocket.send(message);
        }
    }
    
    public void addMessageListener(MessageListener listener) {
        messageListeners.add(listener);
    }
    
    public void removeMessageListener(MessageListener listener) {
        messageListeners.remove(listener);
    }
    
    public void addConnectionListener(ConnectionListener listener) {
        connectionListeners.add(listener);
    }
    
    public void removeConnectionListener(ConnectionListener listener) {
        connectionListeners.remove(listener);
    }
}
