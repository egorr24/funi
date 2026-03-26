package com.flux.app;

import io.socket.client.IO;
import io.socket.client.Socket;
import java.net.URISyntaxException;

public class SocketManager {
    private static SocketManager instance;
    private Socket socket;
    private static final String SERVER_URL = "https://flux-messenger-production.up.railway.app"; 

    private SocketManager() {
        try {
            IO.Options opts = new IO.Options();
            opts.forceNew = true;
            opts.reconnection = true;
            socket = IO.socket(SERVER_URL, opts);
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
    }

    public static synchronized SocketManager getInstance() {
        if (instance == null) {
            instance = new SocketManager();
        }
        return instance;
    }

    public Socket getSocket() {
        return socket;
    }

    public void connect() {
        if (socket != null && !socket.connected()) {
            socket.connect();
        }
    }

    public void disconnect() {
        if (socket != null) {
            socket.disconnect();
        }
    }
}
